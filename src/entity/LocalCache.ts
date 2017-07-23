
/*
    I don't know if Phaser has a way to assign arbitrary values on game objects but since they are just POJOs
    at the end of the day, I'm just gonna implement a local cache on each game object. It's not technically a cache
    but more like a store. Hmm...let's rename it to store.
*/
interface LocalStore {

  localCache: {
    [key: string]: any
  }

  gStore(path: string): any,
  sStore(path: string, value: any): void
}

export default LocalStore
