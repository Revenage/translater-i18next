var fs = require("fs");
const googleTranslate = require('google-translate-api');
var translate = require("./translates.json");
var custom = require("./custom.json");

var defaultLang = 'en'

const languages = Object.keys(translate);
const wordsKeys = Object.keys(translate[defaultLang].translations).sort();
const [en, ...restLanguages] = languages

function getTranslate(str, lang, cb) {
    googleTranslate(str, { from: defaultLang, to: lang }).then(({ text }) => {
        cb(text)
    }).catch(err => {
        console.error(err);
    });
}

function setTraslate(lang, wordsKey, translated, last) {
    translate[lang].translations[wordsKey] = translated;
}

restLanguages.forEach(lang => {
    wordsKeys.forEach(wordsKey => {
        const text = translate[lang].translations[wordsKey];
        if (text == null) {
            const defaultText = translate[defaultLang].translations[wordsKey]
            console.log(`Translate for text ${defaultText} in ${lang} is empty [${wordsKey}]`)
            const last = restLanguages[restLanguages.length - 1] === lang && wordsKeys[wordsKeys.length - 1] === wordsKey;

            if (custom[lang] && custom[lang].translations[wordsKey]) {
                setTraslate(lang, wordsKey, custom[lang].translations[wordsKey], last);
                return;
            }
            getTranslate(defaultText, lang, translated => setTraslate(lang, wordsKey, translated, last));
        }
    })
})


setTimeout(() => {
    write(translate);
}, 1000)

function ksort(src) {
    const keys = Object.keys(src);
    keys.sort();
    return keys.reduce((target, key) => {
        target[key] = src[key];
        return target;
    }, {});
};

function toOrder(obj) {
    languages.forEach(lang => {
        obj[lang].translations = ksort(obj[lang].translations);
    })
    return obj;
}

function write(trans) {

    // const data = JSON.stringify(toOrder(trans), (k, v) => ((v === undefined || v === '"undefined"') ? '""' : v), 4)

    fs.writeFile("output.json", JSON.stringify(toOrder(trans), null, 4), (err) => {
        if (err) {
            console.error(err);
            return;
        };
        console.log("File has been created");
    });
    // fs.writeFile("revision.json", data, err);
}
