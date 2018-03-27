'use strict'

const Model = use('Model')
const { validate } = use('Validator')
const uuidV4 = require('uuid/v4')
const Helpers = use('Helpers')
const Env = use('Env')
const Utils = require('./Utils')

class Layer extends Model {

    static boot () {
      super.boot()

      /**
       * A hook to bash the postgis password before saving
       * it to the database.
       *
       * Look at `app/Models/Hooks/Layer.js` file to
       * check the hashPostgisPass method
       */
      this.addHook('beforeSave', 'Layer.encryptPostgisPass')
    }

    /**
     * Hide fields when exporting users
     * @type {[type]}
     */
    static get hidden () {
      return ['postgis_pass']
    }

    type () {
        return this.belongsTo('App/Models/LayerType')
    }

    projection () {
        return this.belongsTo('App/Models/Projection')
    }

    mapLayers () {
        return this.hasMany('App/Models/MapLayer')
    }

    /**
     * Validate input
     * @param  {Object}  input The record input
     * @return {Promise}
     */
    static async validate(input) {
        const rules = {
            title: 'required',
            seo_slug: 'required',
            type: 'required',
            projection_id: 'required'
        }
        const validation = await validate(input, rules)
        return validation.fails() ? validation.messages() : false
    }

    getStoragePath() {
        return Helpers.publicPath(Env.get('PUBLIC_STORAGE')+'/layer/'+this.id);
    }

    async processFileUpload(request, field, types) {
        const target = this.getStoragePath()
        return await Utils.processFileUpload(request, field, types, target)
    }

    async asGeoJSON(db, query) {
        var json = {
            type: 'FeatureCollection',
            crs: {
                type: 'name',
                properties: {
                    name: 'EPSG:' + query.srs
                }
            },
            features: []
        };

        // Validate
        if (!query || !query.bbox || !query.srs) return json;

        // Build query and params
        var sql = `
            SELECT ${this.postgis_attributes},
                ST_AsGeoJSON(ST_Transform(${this.postgis_field}, ?)) as json
            FROM ${this.postgis_schema}.${this.postgis_table}
            WHERE ST_MakeEnvelope(?,?,?,?,?) && ST_Transform(${this.postgis_field}, ?)
        `;
        var params = []
        params.push(query.srs)
        query.bbox.split(',').map(i => params.push(parseFloat(i)))
        params.push(query.srs)
        params.push(query.srs)

        // Query data
        return new Promise(resolver => {
            db.raw(sql, params).then((resp) => {
                json.features = resp.rows.map(item => {
                    const geometry = JSON.parse(item.json)
                    delete item.json
                    return {
                        type: 'Feature',
                        geometry: geometry,
                        properties: item
                    }
                })
                resolver(json)
            })
            .catch(function(err) {
                console.log(err);
                resolver(false);
            });
        });
    }

}

module.exports = Layer
