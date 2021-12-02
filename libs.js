const {
  axios,
  fs,
  https,
  discordClient: client
} = require('./imports.js');

const Lib = {
  sleep: function(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },
  splitMsgOnLF: function(msg) {
    const LIMIT = 2000;
    let out = [''], j = 0;
    msg = msg.split(/\n/);
    for (let i = 0; i < msg.length; i++) {
      if (out[j].length + msg[i].length >= LIMIT) {
        out.push('');
        j++;
      }
      out[j] += msg[i] + '\n';
    }
    return out;
  },
  getFirstWord: function(str) {
    let out = '';
    for (let c of str) {
      if (c === ' ') return out;
      out += c;
    }
  },
  ensureWriteToFile: async function(filename, data) {
    let isWritten = false;
    while (!isWritten) {
      await Lib.sleep(1000);
      await fs.promises.writeFile(filename, data);
      isWritten = (await fs.promises.readFile(filename, 'utf8')) === data;
    }
  },
  discordEscape: function(str, options = { underscore: true, linkEmbed: true, asterisk: true }) {
    let res = str;
    if (options.underscore === undefined || options.underscore)
      res = res.replaceAll(/_/g, '\\_');
    if (options.linkEmbed === undefined || options.linkEmbed)
      res = res.replaceAll(/(https?:\/\/[\w\-\.\/%&]+)/g, '<$1>');
    if (options.asterisk === undefined || options.asterisk)
      res = res.replaceAll(/\*/g, '\\*');
    return res;
  }
};
const WebScraperLib = {
  scrape: async function(url) {
    return (await axios.get(url)).data;
  },
  stripNBSP: function(str) {
    let out = '';
    for (let c of str) {
      out += c === '\xa0' ? ' ' : c;
    }
    return out;
  },
  getRecursiveData: function(element) {
    if (!element.data && !element.children) return '';
    let desc = '';
    if (element.data) desc += element.data;
    if (element.children) {
      for (let child of element.children) {
        desc += this.getRecursiveData(child);
      }
    }
    return desc;
  }
};
const AjaxLib = {
  httpsget: function(url, headers, encoding = 'utf8') {
    return new Promise((resolve, reject) => {
      let req = https.get(url, {headers: headers}, res => {
        res.setEncoding(encoding);
        let data = '';
        res.on('data', d => data += d);
        res.on('end', () => resolve(data));
      });
      req.on('error', e => reject(e));
      req.end();
    });
  },
  httpspost: function(url, headers, data, encoding = 'utf8') {
    return new Promise((resolve, reject) => {
      let req = https.request(url, headers ? {method: 'POST', headers: headers} : {method: 'POST'}, res => {
        res.setEncoding(encoding);
        let data = '';
        res.on('data', d => data += d);
        res.on('end', () => resolve(data));
      });
      req.on('error', e => reject(e));
      if (data) {
        req.write(data);
      }
      req.end();
    });
  }
}

module.exports = {
  Lib: Lib,
  WebScraperLib: WebScraperLib,
  AjaxLib: AjaxLib
};
