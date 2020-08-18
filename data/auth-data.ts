// this file will provide the cache for sessions so we don't need to hit the DB for every request. In the future this may cause issues: if we decide to run multiple servers in front of one database, we need to make sure the caches do not get out of sync. With only one JS server like we have now, this is perfectly safe :)

import { database } from "./database";

// export async function createSession() {
//   database.session.create({
//     data: {},
//   });
// }
