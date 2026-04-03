export type FrontendWord = {
  id: string
  english?: string
  cree?: string
  hypo?: string[]
  type?: string
  info?: string
}

export const frontendWordList: FrontendWord[] = [
  {
    id: '_animal',
    english: 'Animal',
    cree: 'pisiskiw',
    hypo: ['_panda', '_dog', '_mamahtawisiwin'],
    type: 'Noun',
    info: 'A general category word that links several living-creature concepts together.',
  },
  {
    id: '_dog',
    english: 'Dog',
    cree: 'atim',
    hypo: ['_puppy', '_bark'],
    type: 'Noun',
    info: 'A common household animal and one of the main vocabulary examples in this prototype.',
  },
  {
    id: '_puppy',
    english: 'Puppy',
    cree: 'acimosis',
    hypo: [],
    type: 'Noun',
    info: 'A young dog.',
  },
  {
    id: '_bark',
    english: 'Bark',
    cree: 'mikisimow',
    hypo: [],
    type: 'Verb',
    info: 'The sound a dog makes.',
  },
  {
    id: '_panda',
    english: 'Panda',
    cree: '',
    hypo: [],
    type: 'Noun',
    info: 'A sample animal entry included to demonstrate semantic gap highlighting.',
  },
  {
    id: '_mamahtawisiwin',
    english: '',
    cree: 'mamahtawisiwin',
    hypo: [],
    type: 'Concept',
    info: 'A sample Cree-only entry included to demonstrate semantic gap highlighting.',
  },
]
