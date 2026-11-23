// Change this to your Render server URL after deploying (see README)
const SERVER_URL = 'https://doodle-outpost-server.onrender.com';
const DATA = {
  chars: [['Frost','Fast jetpack refuel'],['Ice Ranger','Extra armor'],['Jungle Scout','Faster reload'],['Shadow','Quick movement'],['Sniper Lynx','Steadier aim'],['Night Ops','Sees through smoke'],['Desert Bear','Heavier health'],['Commando Red','Stronger melee'],['Medic','Heals teammates']],
  maps: ['Desert Base','Prison Yard','Scrapyard','Cave Mine','Underground Bunker','Jungle Village','Snow Base','Industrial Tunnel','Mountain Outpost','Abandoned Lab'],
  // ok:1 = playable now. The other modes are next in the build plan.
  modes: [
    {id:'ffa',n:'Free For All',s:'Solo brawl',ok:1,kills:10,team:0},
    {id:'tdm',n:'Team Deathmatch',s:'Team brawl',ok:1,kills:25,team:1},
    {id:'zom',n:'Zombie Survival',s:'10 waves · co-op',ok:1},{id:'ctf',n:'Capture The Flag',s:'Steal the flag'},
    {id:'boss',n:'Boss Battle',s:'Outpost Titan'},{id:'br',n:'Battle Royale',s:'Last one standing'},
    {id:'clan',n:'Clan Wars',s:'Clan vs clan'},{id:'1v1',n:'1 vs 1',s:'Single duel'},
    {id:'2v2',n:'2 vs 2',s:'Double squad'},{id:'3v3',n:'3 vs 3',s:'Triple squad'},{id:'ai6',n:'1 vs 6 AI',s:'Overdrive'}
  ],
  weapons: [
    {n:'Pistol',img:'pistol',cd:14,dmg:14,spd:16,pel:1,sp:0,am:12,snd:'pistol'},
    {n:'Shotgun',img:'shotgun',cd:40,dmg:9,spd:14,pel:5,sp:.36,am:8,snd:'shotgun'},
    {n:'Sniper',img:'sniper',cd:70,dmg:60,spd:30,pel:1,sp:0,am:5,snd:'sniper'},
    {n:'Rocket',img:'rocket',cd:90,dmg:40,spd:11,pel:1,sp:0,am:3,boom:1,snd:'rocket'},
    {n:'Chainsaw',img:'chainsaw',cd:8,dmg:9,melee:1,am:99,snd:'saw'},
    {n:'Grenade',img:'grenade',grn:1,am:0}
  ]
};
