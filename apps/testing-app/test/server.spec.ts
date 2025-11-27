import { app } from '../src/server';
import { expect } from 'chai';

describe('API Endpoints', () => {
    beforeEach(async () => {
        await app.base().initialize();
    });

    afterEach(async () => {
        await app.stop({
            timeout: 2000,
        });
    });

    it('responds with 200 GET /greet', async () => {
        const res = await app.base().inject({
            method: 'get',
            url: '/greet',
        });
        expect(res.statusCode).to.equal(200);
        expect(res.payload).to.equal('Hello World!');
    });

    it('responds with 200 GET /greet?greeting=Hi&name=Universe', async () => {
        const res = await app.base().inject({
            method: 'get',
            url: '/greet?greeting=Hi&name=Universe',
        });
        expect(res.statusCode).to.equal(200);
        expect(res.payload).to.equal('Hi Universe!');
    });

    it('responds with 400 GET /greet?greeting=Howdy', async () => {
        const res = await app.base().inject({
            method: 'get',
            url: '/greet?greeting=Howdy',
        });
        expect(res.statusCode).to.equal(400);
        expect(JSON.parse(res.payload)).to.deep.include({ message: 'Invalid request query input' });
    });

    it('responds with 404 POST /greet', async () => {
        const res = await app.base().inject({
            method: 'post',
            url: '/greet',
        });
        expect(res.statusCode).to.equal(404);
        expect(JSON.parse(res.payload)).to.deep.include({ message: 'Nothing here' });
    });

    it('responds with 501 POST /error', async () => {
        const res = await app.base().inject({
            method: 'get',
            url: '/error',
        });
        expect(res.statusCode).to.equal(501);
        expect(JSON.parse(res.payload)).to.deep.include({ message: 'This is fine.' });
    });
});
