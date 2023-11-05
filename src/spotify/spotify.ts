
import { readFileSync, statSync, writeFileSync } from 'fs';
import SpotifyWebApi from 'spotify-web-api-node';
import { openApp } from 'open';
export interface SpotifyResponseError extends Error {
    body: {
        error: {
            reason: string;
        }
    }
}

export class Spotify {
    api: SpotifyWebApi;
    static accessTokenLastUpdated?:number;
    static readonly accessTokenLocation = 'secret/access_token.txt';
    static readonly refreshTokenLocation = 'secret/refresh_token.txt';

    constructor() {
        const clientId = process.env.SPOTIFY_CLIENT_ID as string;
        const clientSecret = process.env.SPOTIFY_CLIENT_SECRET as string;
        this.api = new SpotifyWebApi({
            clientId,
            clientSecret,
            redirectUri: 'http://localhost:9876/callback'
        });
    }

    hasExpired() {
        if (!Spotify.accessTokenLastUpdated) {
            const accessTokenStat = statSync(Spotify.accessTokenLocation);
            Spotify.accessTokenLastUpdated = accessTokenStat.mtimeMs;
        }

        const currentTime = new Date().getTime();
        const expiryMargin = 1000 * 60 * 5; // 5 minutes

        const tokenExpirationTime = new Date(Spotify.accessTokenLastUpdated + 3600000 - expiryMargin).getTime();
        return currentTime >= tokenExpirationTime;
    }

    authorize() {
        if (!this.api.getRefreshToken()) {
            this.api.setRefreshToken(readFileSync(Spotify.refreshTokenLocation, 'utf-8'));
        }

        if (!this.api.getAccessToken()) {
            this.api.setAccessToken(readFileSync(Spotify.accessTokenLocation, 'utf-8'));
        }

        if (this.hasExpired()) {
            return this.refreshAccessToken();
        } else {
            return Promise.resolve();
        }
    }

    private refreshAccessToken(): Promise<void> {
        return this.api.refreshAccessToken()
            .then(data => {
                this.api.setAccessToken(data.body.access_token);
                Spotify.accessTokenLastUpdated = new Date().getTime();
                writeFileSync(Spotify.accessTokenLocation, data.body.access_token);
            });
    }

    async getTrack(keyword: string) {
        await this.authorize();
        return this.api.searchTracks(keyword).then(tracksResponse => tracksResponse.body.tracks?.items[0]);
    }

    async getActiveDevice() {
        await this.authorize();
        return this.api.getMyDevices().then(devicesResponse => devicesResponse.body.devices?.find(device => device.is_active));
    }

    play(track: SpotifyApi.TrackObjectFull) : Promise<void> {
        /* istanbul ignore next */
        return this.api.play({
            uris: [track.uri],
        }).then(() => undefined);
    }

    /* istanbul ignore next */
    async startSession() {
        if (process.env.SPOTIFY_BROWSER) {
            await openApp(process.env.SPOTIFY_BROWSER, { arguments: [
                '--profile-directory=Default',
                '--app-id=pjibgclleladliembfgfagdaldikeohf'
            ] });
        } else {
            await openApp('Spotify');
        }
    }
}
const spotify = new Spotify();

export { spotify };
