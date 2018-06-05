var fs = require("fs");
const googleTranslate = require('google-translate-api');
var translate = require("./translates.json");
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
    //console.log(lang, wordsKey, translated);

    translate[lang].translations[wordsKey] = translated;
    console.log(translate, last);

    if (last) {
        setTimeout(() => {
            write(translate);
        }, 1000)
    }
}

restLanguages.forEach(lang => {
    wordsKeys.forEach(wordsKey => {
        const text = translate[lang].translations[wordsKey];
        if (!text) {
            const defaultText = translate[defaultLang].translations[wordsKey]
            console.log(`Translate for text ${defaultText} in ${lang} is empty`)
            const last = restLanguages[restLanguages.length - 1] === lang && wordsKeys[wordsKeys.length - 1] === wordsKey;
            getTranslate(defaultText, lang, translated => setTraslate(lang, wordsKey, translated, last));
        }
    })
})

function write(trans) {
    fs.writeFile("./object.json", JSON.stringify(trans, null, 4), (err) => {
        if (err) {
            console.error(err);
            return;
        };
        console.log("File has been created");
    });
}
