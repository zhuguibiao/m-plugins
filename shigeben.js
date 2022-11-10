function qianqian(packages) {
  const { axios, dayjs } = packages;

  const pageSize = 20;

  const headers = {
      'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36',
      'referer': 'https://12180.net/',
      // 'sec-ch-ua': '"Google Chrome";v="107", "Chromium";v="107", "Not=A?Brand";v="24"',
      // 'sec-ch-ua-mobile': '?0',
      // 'sec-ch-ua-platform': "macOS",
      // 'sec-fetch-dest': 'video',
      // 'sec-fetch-mode': 'no-cors',
      // 'sec-fetch-site': ' cross-site',
  }
  const searchHeaders = {
      'user-agent': 'Music_ZMS/3.0.3 (iPhone; iOS 14.6; Scale/3.00)',
      'accept': '*/*',
      'accept-encoding': 'gzip;q=1.0, compress;q=0.5',
      'accept-language': 'zh-CN,zh;q=1.0',
      'appid': 'hymn',
      'content-type': 'application/json',
      'token': '3710a5f9daff440d5f20c8f268149cf2',
      'timestamp': 1667802700,
      // 'cookie':'security_session_verify=e63cf7e0282b2f7f8a7eb24a6bc69548',
  };

  function formatMusicItem(_) {
      return {
          id: _.id,
          songId: _.gId,
          artwork: _.mPicBig || _.mPicSmal || '',// 首页图
          title: _.name,
          artist: _.bookName, // 作者
          artistItems: [],
          album: '诗歌本', //专辑
          lrc: '',
          url: '',
      }
  }

  function musicCanPlayFilter(_) {
      return _.gId;
  }

  async function searchMusic(query, page) {
      const blob = new Blob([`['${query}']`]);
      const response = await fetch(`https://hymn.christapp.icu:8802/api/Image/Search`, {
          method: 'POST',
          headers: {
              ...searchHeaders
          },
          body: blob
      })
      const res = await response.json()
      return {
          isEnd: true,
          data: res.result.filter(musicCanPlayFilter).map(formatMusicItem)
      }
  }

  async function getLyric(musicItem) {
      const res = (await axios({
          method: 'get',
          url: `https://hymn.christapp.icu:8802/api/SongWords?id=${musicItem.id}`,
          headers: {
              ...searchHeaders
          },
      }));
      return {
          rawLrc: res.data.result.content
      }
  }

  return {
      platform: '诗歌本',
      version: '0.0.1',
      srcUrl: 'https://raw.githubusercontent.com/zhuguibiao/m-plugins/main/shigeben.js',
      cacheControl: 'no-cache',
      async search(query, page, type) {
          if (type === 'music') {
              return await searchMusic(query, page);
          }
      },
      async getMediaSource(musicItem) {
          const res = await axios({
              method: 'post',
              url: `https://hymn.christapp.icu:8802/api/shorten/music`,
              headers: {
                  ...searchHeaders,
                  'musicid': musicItem.songId,
                  'imageid': musicItem.id
              },
          });

          if (res.data.result) {
              const res2 = (await axios({
                  method: 'get',
                  url: `https://12180.net/m/${res.data.result}`,
              }));
              let imgA = res2.data.match(/<img\s*src=\"([^\"]*?)\"[^>]*>/);
              let srcA = res2.data.match(/<source\s*src=\"([^\"]*?)\"[^>]*>/);
              imgA = (imgA && imgA.length && imgA.length > 1) ? imgA[1] : ''
              srcA = (srcA && srcA.length && srcA.length > 1) ? srcA[1] : ''
              // console.log(`https://12180.net/m/${res.data.result}`)
              return {
                  url: srcA,
                  artwork: imgA,
                  duration: 200,
                  headers
              }
          } else {
              return {
                  url: musicItem.url,
                  artwork: '',
                  headers
              };
          }
      },
      // getAlbumInfo,
      getLyric,
      // getArtistWorks,
      // getMusicInfo

  }
}