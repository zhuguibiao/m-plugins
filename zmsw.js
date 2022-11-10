function qianqian(packages) {
    const { axios, dayjs } = packages;

    const pageSize = 20;

    const searchHeaders = {
        'user-agent': 'Music_ZMS/3.0.3 (iPhone; iOS 14.6; Scale/3.00)',
        'referer': 'api.zanmeishige.com',
        'accept': '*/*',
        'accept-encoding': 'gzip, deflate, br',
        'accept-language': 'zh-CN,zh;q=0.9',
    };

    function formatMusicItem(_) {
        return {
            id: _.mSongId,
            artwork: _.mPicBig || _.mPicSmal || '',// 首页图
            title: _.mTitle,
            artist: _.mAuthor, // 作者
            artistItems: [],
            album: _.mAlbumTitle, //专辑
            lrc: 'https://api.zanmeishige.com/song/lrc/' + _.mSongId + '.lrc',
            url: _.mFileLink
        }
    }

    function formatAlbumItem(_) {
        return {
            id: _.mAlbumId,
            artist: (_.artist || []).map(ar => ar.name).join('、'),
            title: _.mTitle,
            artwork: _.mPicBig || _.mPicSmall,
            description: _.mInfo,
            date: dayjs(_.mPulishTime).format('YYYY-MM-DD'),
        }
    }

    function formatArtistItem(_) {
        return {
            name: _.mName,
            id: _.mUid || _.mArtistId,
            avatar: _.mAvatarMiddle,
            worksNum: _.mSongsTotal,
            description: _.mInfo,
        }
    }

    function musicCanPlayFilter(_) {
        return !_.pay_model;
    }

    async function searchBase(query, page, type) {
        const res = (await axios({
            method: 'post',
            url: `https://api.zanmeishige.com/search/${type}`,
            headers: {
                ...searchHeaders
            },
            params: {
                q: query,
                page_no: page,
                page_size: pageSize,
                bduss: ''
            }
        }));
        return res;
    }

    async function searchMusic(query, page) {
        const res = await searchBase(query, page, 'song');
        return {
            isEnd: res.data.mPagesTotal <= page * pageSize,
            data: res.data.mItems.filter(musicCanPlayFilter).map(formatMusicItem)
        }
    }

    async function searchAlbum(query, page) {
        const res = await searchBase(query, page, 'album');

        return {
            isEnd: res.data.mPagesTotal <= page * pageSize,
            data: res.data.mItems.map(formatAlbumItem)
        }
    }

    async function searchArtist(query, page) {
        const res = await searchBase(query, page, 'singer');

        return {
            isEnd: res.data.mRnNum <= page * pageSize,
            data: res.data.mItems.map(formatArtistItem)
        }
    }

    async function getArtistMusicWorks(artistItem, page) {
        const res = (await axios({
            method: 'post',
            url: `https://api.zanmeishige.com/artist/songlist`,
            params: {
                bduss: '',
                limit: pageSize,
                album_id: artistItem.id,
                offset: (page - 1) * pageSize,
                uid: artistItem.id
            }
        }));

        return {
            isEnd: res.data.mNum <= page * pageSize,
            data: res.data.mItems.filter(musicCanPlayFilter).map(formatMusicItem)
        }
    }

    async function getArtistAlbumWorks(artistItem, page) {
        const res = (await axios({
            method: 'post',
            url: `https://api.zanmeishige.com/artist/albumlist`,
            params: {
                bduss: '',
                uid: artistItem.id
            }
        }));
        return {
            isEnd: res.data.mNum <= page * pageSize,
            data: res.data.mItems.filter(musicCanPlayFilter).map(formatAlbumItem)
        }
    }

    async function getArtistWorks(artistItem, page, type) {
        if (type === 'music') {
            return getArtistMusicWorks(artistItem, page);
        } else if (type === 'album') {
            return getArtistAlbumWorks(artistItem, page);
        }
    }

    async function getLyric(musicItem) {
        return {
            lrc: musicItem.lrc
        }
    }

    async function getAlbumInfo(albumItem) {
        if (albumItem.musicList) {
            return albumItem;
        } else {
            const res = (await axios({
                method: 'post',
                url: `https://api.zanmeishige.com/album/info`,
                headers: {
                    ...searchHeaders
                },
                params: {
                    bduss: '',
                    album_id: albumItem.id,
                }
            }));
            const musicList = (res.data.mItems || []).filter(musicCanPlayFilter).map(_ => ({
                ...formatMusicItem(_),
            }))
            return {
                ...albumItem,
                musicList
            }
        }
    }

    async function getMusicInfo(musicItem) {
        const res = (await axios({
            method: 'post',
            url: `https://api.zanmeishige.com/song/info`,
            headers: {
                ...searchHeaders
            },
            params: {
                bduss: '',
                song_id: musicItem.id,
            }
        }));
        const music = formatMusicItem(res.data)
        return {
            ...musicItem,
            music
        }
    }
    return {
        platform: '赞美诗网',
        version: '0.0.1',
        srcUrl: 'https://raw.githubusercontent.com/zhuguibiao/m-plugins/main/shigeben.js',
        cacheControl: 'no-cache',
        async search(query, page, type) {
            if (type === 'music') {
                return await searchMusic(query, page);
            }
            if (type === 'album') {
                return await searchAlbum(query, page);
            }
            if (type === 'artist') {
                return await searchArtist(query, page);
            }
        },
        async getMediaSource(musicItem) {
            const res = (await axios({
                method: 'post',
                url: `https://api.zanmeishige.com/song/info`,
                params: {
                    song_id: musicItem.id,
                    bduss: ''
                }
            }));
            return {
                url: res.data.mFileLink || musicItem.url,
                artwork: res.data.mPicBig || res.data.mPicSmall || '',
            };
        },
        getAlbumInfo,
        getLyric,
        getArtistWorks,
        // getMusicInfo
    }
}