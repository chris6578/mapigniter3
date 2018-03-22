import Store from 'react-observable-store';
import Server from '../../server';

const reload = async () => {
    const url = Store.get('server.endpoint') + '/map';
    const t = setTimeout(() => { Store.update('map', {loading: true}) }, 1000);
    const result = await Server.get(url)
    clearTimeout(t)
    Store.update('map', {loading: false})
    if (result && result.success) Store.set('mapdisplay.items', result.items);
};

const loadMap = async (id, history) => {
    if (!id) return history.push('/');
    const url = Store.get('server.endpoint') + '/map/' + id;
    const t = setTimeout(() => { Store.update('mapdisplay', {loading: true}) }, 1000);
    const result = await Server.get(url)
    clearTimeout(t)
    Store.update('mapdisplay', {loading: false, error: false})
    if (result && result.success) Store.set('mapdisplay.current', result.item);
};

const loadFeatures = async (url, contentType) => {
    var endpoint = Store.get('server.endpoint');
    return new Promise(resolve => {
        fetch(endpoint+'/proxy?url='+url, {
            headers: {
                'Content-Type': contentType
            }
        })
        .then(res => res.json())
        .then((data) => {
            resolve(data);
        });
    });
}

export default {
    reload,
    loadMap,
    loadFeatures
}
