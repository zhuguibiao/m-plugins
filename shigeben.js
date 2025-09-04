const axios = require("axios");
const dayjs = require("dayjs");
const CryptoJs = require("crypto-js");

const headers = {
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Safari/537.36",
  referer: "https://12180.net/",
  // 'sec-ch-ua': '"Google Chrome";v="107", "Chromium";v="107", "Not=A?Brand";v="24"',
  // 'sec-ch-ua-mobile': '?0',
  // 'sec-ch-ua-platform': "macOS",
  // 'sec-fetch-dest': 'video',
  // 'sec-fetch-mode': 'no-cors',
  // 'sec-fetch-site': ' cross-site',
};
function generateCode(id) {
  const now = Math.floor(Date.now() / 1000);
  const baseTime = Math.floor(
    new Date("2010-01-01T00:00:00Z").getTime() / 1000
  );
  const s = now - baseTime;
  const raw = s.toString() + id;
  const md5Val = CryptoJs.MD5(raw).toString();
  const code = md5Val.substring(12, 16);
  return { timestamp: s.toString(), code };
}

const searchHeaders = {
  "user-agent": "Music_ZMS/3.0.3 (iPhone; iOS 14.6; Scale/3.00)",
  accept: "*/*",
  "accept-encoding": "gzip;q=1.0, compress;q=0.5",
  "accept-language": "zh-CN,zh;q=1.0",
  appid: "hymn",
  "content-type": "application/json",
  token: "f2ebaad3810335e3134f7e58d2a9722d",
  // timestamp: Math.floor(Date.now() / 1000),
  timestamp: '1756977474168',
  // 'cookie':'security_session_verify=e63cf7e0282b2f7f8a7eb24a6bc69548',
};

function formatMusicItem(_) {
   const { timestamp, code } = generateCode(_.id);
      
  return {
    id: _.id,
    songId: _.gId,
    artwork: `https://11.400400.icu:9003/api/download/image?id=${_.id}&timestamp=${timestamp}&code=${code}`,
    title: _.name,
    artist: _.bookName, // 作者
    artistItems: [],
    album: "诗歌本", //专辑
    lrc: "",
    url: "",
  };
}

function musicCanPlayFilter(_) {
  return _.gId;
}

async function searchMusic(query, page) {
  const blob = new Blob([`['${query}']`]);
  const response = await fetch(`https://12180.net:8819/api/image/search`, {
    method: "post",
    headers: {
      ...searchHeaders,
    },
    body: blob,
  });
  const res = await response.json();
  return {
    isEnd: true,
    data: res.result.filter(musicCanPlayFilter).map(formatMusicItem),
  };
}

async function getLyric(musicItem) {
  const res = await axios({
    method: "get",
    url: `https://12180.net:8819/api/SongWords?id=${musicItem.id}`,
    headers: {
      ...searchHeaders,
    },
  });
  return {
    rawLrc: res.data.result.content,
  };
}

module.exports = {
  platform: "诗歌本",
  version: "0.0.1",
  srcUrl: "https://raw.githubusercontent.com/zhuguibiao/m-plugins/main/shigeben.js",
  author: "zgb",
  cacheControl: "no-cache",
  async search(query, page, type) {
    if (type === "music") {
      return await searchMusic(query, page);
    }
  },
  async getMediaSource(musicItem) {
    if (musicItem.songId) {
      const { timestamp: musicTimestamp, code: musicCode } = generateCode(
        musicItem.songId
      );
      const { timestamp, code } = generateCode(musicItem.id);
      return {
        url: `https://11.400400.icu:9003/api/download/music?id=${musicItem.songId}&timestamp=${musicTimestamp}&code=${musicCode}`,
        artwork: `https://11.400400.icu:9003/api/download/image?id=${musicItem.id}&timestamp=${timestamp}&code=${code}`,
        artist:'',
        duration: 200,
        headers,
      };
    } else {
      return {
        url: musicItem.url,
        artwork: "",
        headers,
      };
    }
  },
  // getAlbumInfo,
  getLyric,
  // getArtistWorks,
  // getMusicInfo
};
