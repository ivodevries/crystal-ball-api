import { readFileSync, utimesSync } from 'fs';
import { spotify, Spotify, SpotifyResponseError } from './spotify.js';
import { hostname } from 'os';
import { openApp } from 'open';

test('authorization', async () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    console.log(hostname());
    const accessTokenFromFile = readFileSync(Spotify.accessTokenLocation, 'utf-8');
    const refreshTokenFromFile = readFileSync(Spotify.refreshTokenLocation, 'utf-8');

    const moreThanOneHourAgoMs = Date.now() - (3600 * 1001);
    const moreThanOneHourAgoInSeconds = Math.floor(moreThanOneHourAgoMs / 1000);

    // fake the access token to be expired
    utimesSync(Spotify.accessTokenLocation, moreThanOneHourAgoInSeconds, moreThanOneHourAgoInSeconds);
    expect(spotify.hasExpired()).toBe(true);
    await spotify.authorize();
    expect(spotify.hasExpired()).toBe(false);

    const newAccessTokenFromFile = readFileSync(Spotify.accessTokenLocation, 'utf-8');
    const newRefreshTokenFromFile = readFileSync(Spotify.refreshTokenLocation, 'utf-8');
    expect(refreshTokenFromFile).toBe(newRefreshTokenFromFile);
    expect(accessTokenFromFile).not.toBe(newAccessTokenFromFile);

    expect(spotify.api.getAccessToken()).toBe(newAccessTokenFromFile);
    expect(spotify.api.getRefreshToken()).toBe(newRefreshTokenFromFile);

    await spotify.authorize();

    expect(spotify.api.getAccessToken()).toBe(newAccessTokenFromFile);
    expect(spotify.api.getRefreshToken()).toBe(newRefreshTokenFromFile);
});

test('get own device', async () => {
    // const ownDevice = await spotify.getOwnDevice();
    const proc = await openApp('Spotify');

    console.log(proc.pid);
});

test('list devices', async () => {
    await spotify.authorize();
    const devices = await spotify.api.getMyDevices();
    const device = devices.body.devices[0];
    // transfer playback to this device

    expect(process.env.SPOTIFY_BROWSER).toBeDefined();
    if (!process.env.SPOTIFY_BROWSER) {
        return;
    }

    await openApp(process.env.SPOTIFY_BROWSER, { arguments: [
        '--profile-directory=Default',
        '--app-id=pjibgclleladliembfgfagdaldikeohf'
    ] });

    if (device?.id) {
        // /usr/bin/chromium-browser --profile-directory=Default --app-id=pjibgclleladliembfgfagdaldikeohf
        // await spotify.api.transferMyPlayback([device.id]);
    }
});

test('search', async () => {
    const track = await spotify.getTrack('sing, I\'m still standing');
    // const track = await spotify.getTrack('lord of the rings lofi');
    expect(track?.uri).toStartWith('spotify:track:');

    if (track) {
        try {
            await spotify.play(track);
        } catch (error) {
            expect((error as SpotifyResponseError).body.error.reason).toBe('NO_ACTIVE_DEVICE');
        }
    }
});
