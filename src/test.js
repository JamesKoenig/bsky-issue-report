require('dotenv').config();
const { BskyAgent } = require('@atproto/api');

const agent = new BskyAgent({
  service: process.env.BSKY_APP_SERVICE,
});

const auth = {
  identifier: process.env.BSKY_APP_IDENTIFIER,
  password: process.env.BSKY_APP_PASSWORD,
};

function cursorfy(authedAgent,paginatingFn,target,waitTime=250) {
  const cursorFn = paginatingFn.bind(agent);

  return async function(kwArgs) {
    let nextPage = null;
    let res = [];

    do {
      let cursorKwArgs =
        Object.assign({},kwArgs,{cursor: nextPage});

      let { data } = await cursorFn(cursorKwArgs);

      nextPage = data.cursor;
      res = res.concat(data[target]);

      //no ddos the bsky plz
      await new Promise(res => setTimeout(res,waitTime) );
    } while(nextPage);

    return res;
  }
}

async function main() {
  let message = {};
  try {
    await agent.login(auth);

    const getFollowers = cursorfy(agent,agent.getFollowers,"followers");
    const getFollows = cursorfy(agent,agent.getFollows,"follows");

    const examples = [
      'cpsc.gov',
      'pfrazee.com',
      'haileyok.com',
    ];

    for(let idx = 0; idx< examples.length; idx++) {
      const url = examples[idx];
      const kwArgs = { actor: url };
      console.log(`checking ${url}`);
      const { data: { followersCount, followsCount } } =
        await agent.getProfile(kwArgs);
      const {length: apiFollowersCount} = await getFollowers(kwArgs);
      const {length: apiFollowsCount} = await getFollows(kwArgs);

      table = {
        followers: {
          profile: followersCount,
          api: apiFollowersCount,
        },
        following: {
          profile: followsCount,
          api: apiFollowsCount,
        },
      }
      console.table(table);
      console.log('---');
    }
    console.log("done!");
  } catch(e) {
    console.log("I have no idea what happened");
    console.error(e);
  }
}

main();
