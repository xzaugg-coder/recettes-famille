(function () {
  "use strict";

  function toBase64Url(bytes) {
    let binary = "";
    bytes.forEach(function (byte) { binary += String.fromCharCode(byte); });
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  function fromBase64Url(text) {
    const padded = text.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((text.length + 3) % 4);
    const binary = atob(padded);
    return Uint8Array.from(binary, function (char) { return char.charCodeAt(0); });
  }

  function bytesToBinaryString(bytes) {
    let value = "";
    bytes.forEach(function (byte) { value += String.fromCharCode(byte); });
    return value;
  }

  function binaryStringToBytes(value) {
    return Uint8Array.from(value, function (char) { return char.charCodeAt(0); });
  }

  function lzwCompress(value) {
    const dictionary = new Map();
    for (let i = 0; i < 256; i += 1) dictionary.set(String.fromCharCode(i), i);
    let phrase = "";
    let nextCode = 256;
    const output = [];
    for (const char of value) {
      const joined = phrase + char;
      if (dictionary.has(joined)) {
        phrase = joined;
      } else {
        output.push(dictionary.get(phrase));
        dictionary.set(joined, nextCode);
        nextCode += 1;
        phrase = char;
      }
    }
    if (phrase) output.push(dictionary.get(phrase));
    return output;
  }

  function lzwDecompress(codes) {
    const dictionary = new Map();
    for (let i = 0; i < 256; i += 1) dictionary.set(i, String.fromCharCode(i));
    let nextCode = 256;
    let previous = dictionary.get(codes[0]) || "";
    let output = previous;
    for (let index = 1; index < codes.length; index += 1) {
      const code = codes[index];
      const entry = dictionary.has(code) ? dictionary.get(code) : previous + previous.charAt(0);
      output += entry;
      dictionary.set(nextCode, previous + entry.charAt(0));
      nextCode += 1;
      previous = entry;
    }
    return output;
  }

  function packCodes(codes) {
    const bytes = new Uint8Array(codes.length * 2);
    codes.forEach(function (code, index) {
      bytes[index * 2] = (code >> 8) & 255;
      bytes[index * 2 + 1] = code & 255;
    });
    return bytes;
  }

  function unpackCodes(bytes) {
    const codes = [];
    for (let index = 0; index < bytes.length; index += 2) {
      codes.push((bytes[index] << 8) | bytes[index + 1]);
    }
    return codes;
  }

  window.QRCompression = {
    compress: function (text) {
      const bytes = new TextEncoder().encode(text);
      return toBase64Url(packCodes(lzwCompress(bytesToBinaryString(bytes))));
    },
    decompress: function (text) {
      const codes = unpackCodes(fromBase64Url(text));
      const bytes = binaryStringToBytes(lzwDecompress(codes));
      return new TextDecoder().decode(bytes);
    }
  };
})();
