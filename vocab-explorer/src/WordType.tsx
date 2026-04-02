import WordDataJson from './WordData.json'

export interface Word{
  id: string
  english: string
  cree: string
  hypo: string[]
  type: string
  info: string
}


export default class Corpus {
    private static _instance: Corpus;

    wordData: Word[]

    private constructor() {
      this.wordData = WordDataJson as Word[];
    }

    public static get Words() {
        // Do you need arguments? Make it a regular static method instead.
        let instance = this._instance || (this._instance = new this());
         return instance.wordData
    }
}

