var fs = require("fs");
const googleTranslate = require('google-translate-api');

class TranslationApp {
    constructor(translationFilename, customFilename) {

        let translation = {}, custom = {};
        if (fs.existsSync(`./${translationFilename}`)) {
            translation = JSON.parse(fs.readFileSync(translationFilename, 'utf8'));
        }
        if (fs.existsSync(`./${customFilename}`)) {
            custom = JSON.parse(fs.readFileSync(customFilename, 'utf8'));
        }

        const defaultLang = 'en'
        const languages = Object.keys(translation);
        const dict = translation[defaultLang].translations;
        const wordsKeys = Object.keys(dict).sort();
        const [mainLang, ...restLanguages] = languages
        const output = { ...translation }

        Object.assign(this, {
            translation,
            defaultLang,
            languages,
            wordsKeys,
            mainLang,
            restLanguages,
            output,
            dict,
            custom,
        });
    }

    async getTranslate(str, lang, wordsKey) {
        // this.setTraslate(lang, wordsKey, translated)
        const { text } = await googleTranslate(str, { from: this.defaultLang, to: lang })
        await this.setTraslate(lang, wordsKey, text)
        // googleTranslate(str, { from: this.defaultLang, to: lang }).then(({ text }) => {
        //     cb(text)
        // }).catch(err => {
        //     console.error(err);
        // });
    }

    async setTraslate(lang, wordsKey, translated) {
        const { output } = this;
        output[lang].translations[wordsKey] = translated;
    }

    async findTranslation() {
        const { translation, defaultLang, restLanguages, wordsKeys, custom } = this;
        let actions = [];
        console.log('custom', custom);

        restLanguages.forEach(lang => {
            wordsKeys.forEach(wordsKey => {
                const text = translation[lang].translations[wordsKey];
                if (text == null) {
                    const defaultText = translation[defaultLang].translations[wordsKey]
                    console.log(`Translate for text ${defaultText} in ${lang} is empty [${wordsKey}]`)
                    if (custom[lang] && custom[lang][wordsKey]) {
                        actions = actions.concat(this.setTraslate(lang, wordsKey, custom[lang][wordsKey]))
                        return;
                    }
                    actions = actions.concat(this.getTranslate(defaultText, lang, wordsKey));
                }
            })
        }) // 
        await Promise.all(actions);
        return this.output
    }

    ksort(src) {
        const keys = Object.keys(src);
        keys.sort();
        return keys.reduce((target, key) => {
            target[key] = src[key];
            return target;
        }, {});
    };

    toOrder(obj) {
        this.languages.forEach(lang => {
            obj[lang].translations = this.ksort(obj[lang].translations);
        })
        return obj;
    }

    async write(filename) {
        const trans = await this.findTranslation();
        const orderedTrans = this.toOrder(trans)

        if (fs.existsSync(`./${filename}`)) {
            await fs.unlinkSync(filename);
        }
        await fs.writeFile(filename, JSON.stringify(orderedTrans, null, 4), (err) => {
            if (err) {
                console.error(err);
                return;
            };
            console.log("File has been created");
        });

    }

    findSameValues() {
        const { translation } = this;
        const dict = translation[defaultLang].translations;
        const register = [], empyValues = [], sameValues = [];
        const filteredArray = Object.keys(dict).map(key => {
            if (register.includes(key)) return null;
            const value = dict[key]
            if (!value) {
                register.push(key);
                empyValues.push(`${key}`);
                return null;
            }
            Object.keys(dict).forEach((_key) => {
                if (register.includes(_key)) return null;
                const _value = dict[_key]
                if (value && _value && value === _value && key !== _key) {
                    register.push(key)
                    sameValues.push(`${key} and ${_key}`)
                }
            })
            return { [key]: value };
        }).filter(Boolean)

        return filteredArray;

        if (empyValues.length) {
            console.log('\x1b[35m', `${empyValues.length} Empty value${empyValues.length > 1 ? 's' : ''}:`);
            console.log(`${empyValues.join('\n')}`);
        }
        if (sameValues.length) {
            console.log('\x1b[33m%s\x1b[0m', `${sameValues.length} Key${sameValues.length > 1 ? 's' : ''} have same values:`);
            console.log(`${sameValues.join('\n')}`);
        }
    }

    findUsedTranslates() {
        const dict = translate[defaultLang].translations;
        const keys = Object.keys(dict);
        fs.readFile(filename, 'utf8', (err, str) => {
            if (err) throw err;
            const regexp = /'(.*([A-Z._-]{3}))'/g;
            const match = str.match(regexp).map(s => s.replace(/\'/g, ''))

            const output = [];
            const hasNotTranslate = [];

            match.forEach(m => {
                if (!keys.includes(match)) {
                    hasNotTranslate.push(m)
                }
            })

            const filteredDict = keys.map(key => {
                if (match.includes(key)) {
                    return { [key]: dict[key] }
                } else {
                    output.push(key)
                }
            }).filter(Boolean);

            if (output.length) {
                console.log('\x1b[35m', `${output.length} Unused keys:`);
                console.log(`${output.join('\n')}`);
            }

            if (hasNotTranslate.length) {
                console.log('\x1b[33m%s\x1b[0m', `${output.length} Key${output.length > 1 ? 's' : ''} which in use but isn\'t in translation file:`);
                console.log(`${hasNotTranslate.join('\n')}`);
            }
            return filteredDict;
        });
    }

    merge(...filenames) {
        const { defaultLang } = this;
        filenames.forEach(filename => {
            if (fs.existsSync(`./${filename}`)) {
                const file = JSON.parse(fs.readFileSync(filename, 'utf8'));
                this.output[defaultLang].translations = { ...this.output[defaultLang].translations, ...file[defaultLang].translations }
            }
        });
        this.output = this.toOrder(this.output);

        return this.output;
    }

};

const translator = new TranslationApp("translates.json", "custom.json");

translator.merge("translates.json", "translates2.json");
// translator.write("output.json");