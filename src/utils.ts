/**
 * Limits a promise to a given time frame
 * @param func the function you want to limit
 * @param maxTime how much time the function should take at most to resolve in milliseconds
 */
export async function limitPromise(func: () => Promise<any>, maxTime: number) {
  return await Promise.race([func(), _timeout(maxTime)])
}

async function _timeout(maxTime: number) {
  return new Promise(async (resolve) => {
    setTimeout(() => {
      resolve(new Error('Could not push .nupkg to GitHub registry. A timeout occured.'));
    }, maxTime)
  })
}
