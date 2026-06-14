/* Builds data.json (real historical squads) and injects it into index.html.
   Each player is authored as [name, position, overall]; detailed attributes are
   derived from a position archetype so the engine has full, consistent stats. */
const fs = require("fs");

// manager: [attackingStyle, defensiveStyle, possession, counterAttack, bigMatch]
const SQUADS = [
  { club:"Manchester United", season:"1998/99", country:"England", league:"Premier League",
    mgr:["Alex Ferguson",84,80,74,80,92], players:[
    ["Peter Schmeichel","GK",90],["Gary Neville","RB",82],["Jaap Stam","CB",88],["Ronny Johnsen","CB",80],["Denis Irwin","LB",83],
    ["Roy Keane","CM",90],["Paul Scholes","CM",87],["David Beckham","RM",88],["Ryan Giggs","LW",88],["Dwight Yorke","ST",86],["Andy Cole","ST",84]]},

  { club:"Arsenal", season:"2003/04", country:"England", league:"Premier League",
    mgr:["Arsène Wenger",88,78,84,74,84], players:[
    ["Jens Lehmann","GK",84],["Lauren","RB",80],["Sol Campbell","CB",87],["Kolo Touré","CB",83],["Ashley Cole","LB",85],
    ["Patrick Vieira","CM",90],["Gilberto Silva","CDM",82],["Freddie Ljungberg","RM",84],["Robert Pirès","LW",87],["Thierry Henry","ST",95],["Dennis Bergkamp","CF",88]]},

  { club:"Barcelona", season:"2010/11", country:"Spain", league:"La Liga",
    mgr:["Pep Guardiola",92,80,98,60,90], players:[
    ["Víctor Valdés","GK",85],["Dani Alves","RB",86],["Gerard Piqué","CB",87],["Carles Puyol","CB",86],["Éric Abidal","LB",82],
    ["Sergio Busquets","CDM",85],["Xavi","CM",92],["Andrés Iniesta","CAM",91],["Pedro","RW",82],["Lionel Messi","CF",96],["David Villa","LW",88]]},

  { club:"Real Madrid", season:"2016/17", country:"Spain", league:"La Liga",
    mgr:["Zinedine Zidane",88,82,85,78,92], players:[
    ["Keylor Navas","GK",83],["Dani Carvajal","RB",83],["Sergio Ramos","CB",89],["Raphaël Varane","CB",84],["Marcelo","LB",86],
    ["Casemiro","CDM",84],["Toni Kroos","CM",89],["Luka Modrić","CM",89],["Gareth Bale","RW",88],["Cristiano Ronaldo","LW",94],["Karim Benzema","CF",86]]},

  { club:"Liverpool", season:"2019/20", country:"England", league:"Premier League",
    mgr:["Jürgen Klopp",90,82,80,86,88], players:[
    ["Alisson","GK",89],["Trent Alexander-Arnold","RB",86],["Joe Gomez","CB",81],["Virgil van Dijk","CB",91],["Andrew Robertson","LB",86],
    ["Fabinho","CDM",84],["Jordan Henderson","CM",84],["Georginio Wijnaldum","CM",82],["Mohamed Salah","RW",90],["Roberto Firmino","CF",85],["Sadio Mané","LW",89]]},

  { club:"Manchester City", season:"2017/18", country:"England", league:"Premier League",
    mgr:["Pep Guardiola",93,80,95,64,86], players:[
    ["Ederson","GK",86],["Kyle Walker","RB",84],["John Stones","CB",82],["Nicolás Otamendi","CB",82],["Fabian Delph","LB",79],
    ["Fernandinho","CDM",85],["Kevin De Bruyne","CM",92],["David Silva","CM",89],["Raheem Sterling","RW",85],["Sergio Agüero","ST",89],["Leroy Sané","LW",85]]},

  { club:"Chelsea", season:"2004/05", country:"England", league:"Premier League",
    mgr:["José Mourinho",76,94,74,88,90], players:[
    ["Petr Čech","GK",86],["Paulo Ferreira","RB",80],["John Terry","CB",88],["Ricardo Carvalho","CB",85],["William Gallas","LB",83],
    ["Claude Makélélé","CDM",84],["Frank Lampard","CM",89],["Joe Cole","CAM",82],["Arjen Robben","RW",86],["Didier Drogba","ST",86],["Damien Duff","LW",83]]},

  { club:"Inter Milan", season:"2009/10", country:"Italy", league:"Serie A",
    mgr:["José Mourinho",74,93,72,90,92], players:[
    ["Júlio César","GK",86],["Maicon","RB",86],["Lúcio","CB",85],["Walter Samuel","CB",84],["Javier Zanetti","LB",85],
    ["Esteban Cambiasso","CDM",84],["Wesley Sneijder","CAM",88],["Dejan Stanković","CM",82],["Samuel Eto'o","RW",88],["Diego Milito","ST",86],["Goran Pandev","LW",80]]},

  { club:"AC Milan", season:"2006/07", country:"Italy", league:"Serie A",
    mgr:["Carlo Ancelotti",84,84,82,78,90], players:[
    ["Dida","GK",83],["Massimo Oddo","RB",79],["Alessandro Nesta","CB",88],["Paolo Maldini","CB",86],["Marek Jankulovski","LB",79],
    ["Gennaro Gattuso","CDM",82],["Andrea Pirlo","CM",89],["Clarence Seedorf","CM",85],["Kaká","RW",92],["Filippo Inzaghi","ST",84],["Alberto Gilardino","LW",82]]},

  { club:"Bayern Munich", season:"2012/13", country:"Germany", league:"Bundesliga",
    mgr:["Jupp Heynckes",86,84,84,80,88], players:[
    ["Manuel Neuer","GK",90],["Philipp Lahm","RB",87],["Jérôme Boateng","CB",84],["Dante","CB",82],["David Alaba","LB",84],
    ["Bastian Schweinsteiger","CM",87],["Javi Martínez","CDM",84],["Toni Kroos","CM",85],["Arjen Robben","RW",88],["Mario Mandžukić","ST",83],["Franck Ribéry","LW",89]]},

  { club:"Manchester United", season:"2007/08", country:"England", league:"Premier League",
    mgr:["Alex Ferguson",86,82,78,82,92], players:[
    ["Edwin van der Sar","GK",86],["Wes Brown","RB",80],["Rio Ferdinand","CB",88],["Nemanja Vidić","CB",88],["Patrice Evra","LB",84],
    ["Owen Hargreaves","CM",82],["Michael Carrick","CM",84],["Paul Scholes","CM",85],["Cristiano Ronaldo","RW",91],["Wayne Rooney","CF",87],["Carlos Tévez","ST",85]]},

  { club:"Barcelona", season:"2014/15", country:"Spain", league:"La Liga",
    mgr:["Luis Enrique",90,80,90,78,86], players:[
    ["Marc-André ter Stegen","GK",85],["Dani Alves","RB",85],["Gerard Piqué","CB",86],["Javier Mascherano","CB",83],["Jordi Alba","LB",84],
    ["Sergio Busquets","CDM",86],["Ivan Rakitić","CM",84],["Andrés Iniesta","CM",88],["Lionel Messi","RW",95],["Luis Suárez","ST",90],["Neymar","LW",89]]},

  { club:"Real Madrid", season:"2002/03", country:"Spain", league:"La Liga",
    mgr:["Vicente del Bosque",86,80,84,80,88], players:[
    ["Iker Casillas","GK",86],["Míchel Salgado","RB",80],["Fernando Hierro","CB",84],["Iván Helguera","CB",82],["Roberto Carlos","LB",87],
    ["Claude Makélélé","CDM",83],["Zinedine Zidane","CM",94],["Guti","CM",82],["Luís Figo","RW",89],["Ronaldo","ST",93],["Raúl","LW",88]]},

  { club:"Juventus", season:"1996/97", country:"Italy", league:"Serie A",
    mgr:["Marcello Lippi",82,86,80,84,88], players:[
    ["Angelo Peruzzi","GK",84],["Moreno Torricelli","RB",78],["Ciro Ferrara","CB",82],["Mark Iuliano","CB",78],["Gianluca Pessotto","LB",78],
    ["Didier Deschamps","CDM",82],["Zinedine Zidane","CAM",90],["Antonio Conte","CM",80],["Alessandro Del Piero","CF",89],["Christian Vieri","ST",85],["Alen Bokšić","LW",82]]},

  { club:"Liverpool", season:"2004/05", country:"England", league:"Premier League",
    mgr:["Rafael Benítez",80,86,80,84,88], players:[
    ["Jerzy Dudek","GK",80],["Steve Finnan","RB",79],["Jamie Carragher","CB",84],["Sami Hyypiä","CB",83],["Djimi Traoré","LB",75],
    ["Xabi Alonso","CM",85],["Steven Gerrard","CAM",89],["Luis García","RW",81],["Harry Kewell","LW",80],["Milan Baroš","ST",80],["Djibril Cissé","ST",80]]},

  { club:"Bayern Munich", season:"2019/20", country:"Germany", league:"Bundesliga",
    mgr:["Hansi Flick",90,82,86,84,86], players:[
    ["Manuel Neuer","GK",88],["Benjamin Pavard","RB",82],["Jérôme Boateng","CB",82],["David Alaba","CB",85],["Alphonso Davies","LB",83],
    ["Joshua Kimmich","CM",88],["Leon Goretzka","CM",84],["Thiago","CM",86],["Serge Gnabry","RW",85],["Robert Lewandowski","ST",92],["Kingsley Coman","LW",83]]},

  { club:"Manchester City", season:"2022/23", country:"England", league:"Premier League",
    mgr:["Pep Guardiola",92,84,94,66,90], players:[
    ["Ederson","GK",87],["Kyle Walker","RB",83],["Rúben Dias","CB",87],["John Stones","CB",84],["Nathan Aké","LB",82],
    ["Rodri","CDM",89],["Kevin De Bruyne","CM",91],["Bernardo Silva","CM",87],["Riyad Mahrez","RW",85],["Erling Haaland","ST",91],["Jack Grealish","LW",84]]},

  { club:"Real Madrid", season:"2013/14", country:"Spain", league:"La Liga",
    mgr:["Carlo Ancelotti",88,82,84,82,90], players:[
    ["Iker Casillas","GK",84],["Dani Carvajal","RB",81],["Sergio Ramos","CB",88],["Pepe","CB",84],["Marcelo","LB",85],
    ["Xabi Alonso","CDM",84],["Luka Modrić","CM",87],["Ángel Di María","CM",86],["Gareth Bale","RW",87],["Cristiano Ronaldo","LW",94],["Karim Benzema","CF",85]]},

  { club:"Borussia Dortmund", season:"2012/13", country:"Germany", league:"Bundesliga",
    mgr:["Jürgen Klopp",88,80,78,88,84], players:[
    ["Roman Weidenfeller","GK",80],["Łukasz Piszczek","RB",81],["Mats Hummels","CB",86],["Neven Subotić","CB",81],["Marcel Schmelzer","LB",80],
    ["Sven Bender","CDM",80],["İlkay Gündoğan","CM",83],["Mario Götze","CAM",84],["Jakub Błaszczykowski","RW",81],["Robert Lewandowski","ST",87],["Marco Reus","LW",86]]},

  { club:"Chelsea", season:"2020/21", country:"England", league:"Premier League",
    mgr:["Thomas Tuchel",82,88,82,82,88], players:[
    ["Édouard Mendy","GK",84],["Reece James","RB",82],["Thiago Silva","CB",85],["Antonio Rüdiger","CB",83],["Ben Chilwell","LB",81],
    ["N'Golo Kanté","CDM",88],["Jorginho","CM",83],["Mason Mount","CAM",82],["Hakim Ziyech","RW",82],["Timo Werner","ST",81],["Christian Pulišić","LW",81]]},

  { club:"AC Milan", season:"1993/94", country:"Italy", league:"Serie A",
    mgr:["Fabio Capello",80,90,82,80,88], players:[
    ["Sebastiano Rossi","GK",80],["Mauro Tassotti","RB",79],["Franco Baresi","CB",88],["Alessandro Costacurta","CB",84],["Paolo Maldini","LB",88],
    ["Marcel Desailly","CDM",84],["Demetrio Albertini","CM",82],["Roberto Donadoni","RM",82],["Dejan Savićević","RW",84],["Daniele Massaro","ST",80],["Marco Simone","LW",80]]},

  { club:"Paris Saint-Germain", season:"2019/20", country:"France", league:"Ligue 1",
    mgr:["Thomas Tuchel",90,78,86,82,82], players:[
    ["Keylor Navas","GK",84],["Thomas Meunier","RB",79],["Thiago Silva","CB",84],["Presnel Kimpembe","CB",80],["Juan Bernat","LB",79],
    ["Marquinhos","CDM",84],["Marco Verratti","CM",85],["Ángel Di María","CAM",85],["Kylian Mbappé","RW",90],["Mauro Icardi","ST",82],["Neymar","LW",91]]},

  { club:"Ajax", season:"1994/95", country:"Netherlands", league:"Eredivisie",
    mgr:["Louis van Gaal",84,82,88,74,84], players:[
    ["Edwin van der Sar","GK",82],["Michael Reiziger","RB",79],["Danny Blind","CB",82],["Frank de Boer","CB",83],["Frank Rijkaard","CDM",85],
    ["Edgar Davids","CM",82],["Clarence Seedorf","CM",82],["Ronald de Boer","CAM",81],["Finidi George","RW",80],["Patrick Kluivert","ST",82],["Marc Overmars","LW",84]]},

  { club:"Manchester United", season:"1993/94", country:"England", league:"Premier League",
    mgr:["Alex Ferguson",84,80,74,80,90], players:[
    ["Peter Schmeichel","GK",88],["Paul Parker","RB",78],["Steve Bruce","CB",80],["Gary Pallister","CB",82],["Denis Irwin","LB",82],
    ["Paul Ince","CM",83],["Roy Keane","CM",84],["Andrei Kanchelskis","RM",81],["Ryan Giggs","LW",85],["Eric Cantona","CF",88],["Mark Hughes","ST",82]]},
];

/* ===== Football-Manager-style attribute model (all rated /99) ===== */
const POS_LINE = {GK:"GK",CB:"DEF",LB:"DEF",RB:"DEF",CDM:"MID",CM:"MID",CAM:"MID",LM:"MID",RM:"MID",LW:"FWD",RW:"FWD",ST:"FWD",CF:"FWD"};
const TECH=["corners","crossing","dribbling","finishing","firstTouch","freeKick","heading","longShots","longThrows","marking","passing","penalties","tackling","technique"];
const MENT=["aggression","anticipation","bravery","composure","concentration","decisions","determination","flair","leadership","offTheBall","positioning","teamwork","vision","workRate"];
const PHYS=["acceleration","agility","balance","jumpingReach","naturalFitness","pace","stamina","strength"];
const GKA=["aerialReach","commandOfArea","communication","eccentricity","handling","kicking","oneOnOnes","punching","reflexes","rushingOut","throwing"];
const OUT=[...TECH,...MENT,...PHYS];

const clampA=(n)=>Math.max(1,Math.min(99,Math.round(n)));
function jit(name,attr){let h=0;const s=name+"|"+attr;for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))>>>0;return (h%5)-2;}
function rnd(name,attr){let h=0;const s=name+"#"+attr;for(let i=0;i<s.length;i++)h=(h*131+s.charCodeAt(i))>>>0;return (h%1000)/1000;}

// generic specialism baseline (applies unless a position overrides the attribute)
const GEN={corners:-7,crossing:-6,freeKick:-9,longShots:-5,longThrows:-16,penalties:-6,flair:-4,leadership:-5,heading:-3};
// per-position deltas relative to the player's overall (only role-defining attributes listed)
const DELTAS={
  GK:{finishing:-72,dribbling:-66,tackling:-58,marking:-56,crossing:-70,heading:-58,longShots:-72,corners:-70,freeKick:-66,penalties:-58,longThrows:-50,firstTouch:-40,passing:-30,technique:-44,
      aggression:-30,anticipation:-8,bravery:-6,composure:-6,concentration:-2,decisions:-8,flair:-42,leadership:-6,offTheBall:-52,positioning:-8,teamwork:-12,vision:-32,workRate:-18,
      acceleration:-28,agility:-6,balance:-10,jumpingReach:-6,naturalFitness:-4,pace:-30,stamina:-22,strength:-8},
  CB:{marking:8,tackling:7,positioning:8,heading:9,jumpingReach:9,strength:8,bravery:6,concentration:6,anticipation:6,composure:3,aggression:5,decisions:4,workRate:2,
      finishing:-34,dribbling:-16,crossing:-18,offTheBall:-14,flair:-14,longShots:-24,technique:-8,vision:-8,agility:-10,acceleration:-8,pace:-5,firstTouch:-6,corners:-12,penalties:-12,passing:-4},
  LB:{crossing:6,stamina:8,workRate:7,pace:7,acceleration:7,tackling:5,marking:5,positioning:4,teamwork:5,agility:5,anticipation:3,dribbling:3,technique:2,firstTouch:2,concentration:3,balance:3,
      finishing:-22,heading:-7,jumpingReach:-5,strength:-3,longShots:-15,offTheBall:-2},
  RB:{crossing:6,stamina:8,workRate:7,pace:7,acceleration:7,tackling:5,marking:5,positioning:4,teamwork:5,agility:5,anticipation:3,dribbling:3,technique:2,firstTouch:2,concentration:3,balance:3,
      finishing:-22,heading:-7,jumpingReach:-5,strength:-3,longShots:-15,offTheBall:-2},
  CDM:{tackling:7,marking:6,positioning:7,anticipation:6,workRate:7,stamina:7,strength:5,teamwork:6,composure:4,concentration:5,decisions:5,aggression:5,passing:3,bravery:4,
      finishing:-18,offTheBall:-8,flair:-8,dribbling:-6,crossing:-10,longShots:-6,pace:-4,acceleration:-4},
  CM:{passing:6,vision:4,workRate:5,stamina:6,technique:4,decisions:5,composure:4,teamwork:5,tackling:2,firstTouch:4,anticipation:4,offTheBall:2,longShots:2,
      marking:-2,finishing:-8,heading:-4,strength:-2},
  CAM:{vision:7,passing:6,technique:7,flair:6,composure:5,dribbling:5,decisions:4,offTheBall:5,firstTouch:6,longShots:5,freeKick:4,corners:3,anticipation:3,agility:4,balance:3,
      tackling:-12,marking:-15,positioning:-8,strength:-5,heading:-8,jumpingReach:-8,workRate:-2,aggression:-4},
  LM:{crossing:7,stamina:6,workRate:5,pace:6,acceleration:6,dribbling:5,technique:4,teamwork:4,agility:5,balance:4,offTheBall:3,firstTouch:3,flair:3,
      finishing:-10,tackling:-6,marking:-10,positioning:-6,heading:-8,jumpingReach:-6,strength:-5,longShots:-4},
  RM:{crossing:7,stamina:6,workRate:5,pace:6,acceleration:6,dribbling:5,technique:4,teamwork:4,agility:5,balance:4,offTheBall:3,firstTouch:3,flair:3,
      finishing:-10,tackling:-6,marking:-10,positioning:-6,heading:-8,jumpingReach:-6,strength:-5,longShots:-4},
  LW:{dribbling:7,pace:8,acceleration:8,crossing:5,agility:7,flair:6,technique:6,offTheBall:5,firstTouch:5,balance:5,finishing:3,longShots:2,
      tackling:-18,marking:-20,positioning:-12,strength:-6,heading:-8,jumpingReach:-8,workRate:-2,aggression:-4,bravery:-2},
  RW:{dribbling:7,pace:8,acceleration:8,crossing:5,agility:7,flair:6,technique:6,offTheBall:5,firstTouch:5,balance:5,finishing:3,longShots:2,
      tackling:-18,marking:-20,positioning:-12,strength:-6,heading:-8,jumpingReach:-8,workRate:-2,aggression:-4,bravery:-2},
  ST:{finishing:8,offTheBall:7,composure:5,anticipation:6,heading:5,firstTouch:4,acceleration:5,pace:5,strength:4,jumpingReach:4,dribbling:2,longShots:3,bravery:4,balance:2,
      tackling:-26,marking:-26,positioning:-12,crossing:-12,passing:-8,vision:-6,corners:-12,freeKick:-6,workRate:-3,teamwork:-4},
  CF:{finishing:6,offTheBall:6,firstTouch:6,technique:6,composure:6,vision:5,passing:5,dribbling:5,flair:5,anticipation:5,longShots:4,heading:3,
      tackling:-22,marking:-22,positioning:-10,strength:-2,workRate:-2,crossing:-6},
};
const GK_GROUP={aerialReach:5,commandOfArea:4,communication:4,eccentricity:-22,handling:7,kicking:1,oneOnOnes:6,punching:-2,reflexes:8,rushingOut:-10,throwing:1};

function playerAttrs(name,pos,ovr){
  const d=DELTAS[pos]||{};const o={};const line=POS_LINE[pos];
  for(const a of OUT){const delta=(d[a]!==undefined)?d[a]:(GEN[a]||0);o[a]=clampA(ovr+delta+jit(name,a));}
  if(pos==="GK"){for(const a of GKA)o[a]=clampA(ovr+(GK_GROUP[a]||0)+jit(name,a));}
  // keep profiles believable (display-only: these attrs aren't in the role's engine weights)
  const cap=(k,m)=>{o[k]=Math.min(o[k],clampA(m+jit(name,k+"c")));};
  if(line==="FWD"||pos==="CAM"){cap("marking",30);cap("tackling",37);cap("positioning",49);}
  if(line==="DEF"){["finishing","longShots","corners","freeKick","penalties"].forEach(k=>cap(k,40));cap("dribbling",60);cap("flair",52);
    if(pos==="CB"){cap("crossing",42);cap("vision",60);cap("technique",64);cap("pace",86);}}
  return o;
}

// icon overall bumps so prime seasons feel elite
const OVR_OVERRIDE={
  "Barcelona|2010/11|Lionel Messi":99,"Barcelona|2014/15|Lionel Messi":96,
  "Real Madrid|2016/17|Cristiano Ronaldo":96,"Real Madrid|2013/14|Cristiano Ronaldo":95,"Manchester United|2007/08|Cristiano Ronaldo":93,
  "Real Madrid|2002/03|Ronaldo":95,"Arsenal|2003/04|Thierry Henry":95,"Real Madrid|2002/03|Zinedine Zidane":95,"Juventus|1996/97|Zinedine Zidane":92,
  "Barcelona|2010/11|Xavi":93,"Manchester City|2017/18|Kevin De Bruyne":93,"Manchester City|2022/23|Kevin De Bruyne":93,
  "Manchester City|2022/23|Erling Haaland":93,"Bayern Munich|2019/20|Robert Lewandowski":93,"AC Milan|2006/07|Kaká":93,
  "Liverpool|2019/20|Virgil van Dijk":92,"Liverpool|2019/20|Mohamed Salah":91,"Barcelona|2014/15|Luis Suárez":91,"Barcelona|2014/15|Neymar":90,
  "Paris Saint-Germain|2019/20|Neymar":92,"Paris Saint-Germain|2019/20|Kylian Mbappé":91,"Manchester United|1998/99|Roy Keane":90,
};
// signature market values (£m); others derived from overall
const VALUE_OVERRIDE={
  "Barcelona|2010/11|Lionel Messi":424,"Barcelona|2014/15|Lionel Messi":300,"Real Madrid|2016/17|Cristiano Ronaldo":330,
  "Manchester City|2022/23|Erling Haaland":280,"Paris Saint-Germain|2019/20|Kylian Mbappé":300,"Bayern Munich|2019/20|Robert Lewandowski":190,
};
function valueFor(ovr,key,name){
  if(VALUE_OVERRIDE[key]!==undefined)return VALUE_OVERRIDE[key];
  const base=5.1e-10*Math.pow(Math.max(1,ovr-49),7.0);
  return Math.max(1,Math.round(base*(0.9+0.2*rnd(name,"val"))));
}

// multi-position eligibility (broad, FM-like). Strict where iconic (Van Dijk = CB only).
const SEC={GK:[],CB:[],LB:["RB","LM"],RB:["LB","RM"],CDM:["CM","CB"],CM:["CDM","CAM"],CAM:["CM","RW","LW"],
  LM:["LW","LB","CM"],RM:["RW","RB","CM"],LW:["LM","RW","ST","CAM"],RW:["RM","LW","ST","CAM"],ST:["CF","LW","RW"],CF:["ST","CAM"]};
const POS_OVR={
  "Philipp Lahm":["RB","LB","CDM"],"Cristiano Ronaldo":["RW","LW","ST"],"Virgil van Dijk":["CB"],
  "Sergio Ramos":["CB","RB"],"David Alaba":["LB","CB","CDM"],"Paolo Maldini":["LB","CB"],"Javier Zanetti":["RB","LB","RM"],
  "Frank Rijkaard":["CDM","CB"],"Javier Mascherano":["CDM","CB"],"Joshua Kimmich":["CM","CDM","RB"],"Bastian Schweinsteiger":["CM","CDM"],
  "Thiago":["CM","CDM","CAM"],"Fabinho":["CDM","CB"],"Zinedine Zidane":["CAM","CM"],"Andrés Iniesta":["CM","CAM","LW"],
  "Kevin De Bruyne":["CM","CAM"],"Toni Kroos":["CM","CDM"],"Luka Modrić":["CM","CAM"],"Marcelo":["LB","LM"],"Dani Alves":["RB","RM"],
  "Roberto Carlos":["LB","LM"],"Ángel Di María":["RW","LW","CAM"],"Gareth Bale":["RW","LW"],"Neymar":["LW","CF","ST"],"Kylian Mbappé":["ST","LW","RW"],
  "Lionel Messi":["RW","CF","CAM"],"Karim Benzema":["CF","ST"],"Wayne Rooney":["CF","ST","CAM"],"Raúl":["CF","ST","LW"],
  "Franco Baresi":["CB"],"Alessandro Nesta":["CB"],"Frank de Boer":["CB","LB"]
};
function eligibleFor(name,primary){const base=POS_OVR[name]||[primary,...(SEC[primary]||[])];return [...new Set(base)].filter(p=>p!==primary);}

/* ===== manager model ===== */
const MGR=["adaptability","attacking","defending","determination","discipline","fitness","levelOfDiscipline","manManagement","mental","motivating","peopleManagement","tactical","technical"];
function mgrAttrs(m,key){ // m=[name,atk,def,poss,counter,big]
  const atk=m[1],def=m[2],poss=m[3],counter=m[4],big=m[5];
  const a={
    attacking:clampA(atk),defending:clampA(def),
    tactical:clampA((atk+def+poss)/3+4+jit(key,"tac")),
    mental:clampA(big),motivating:clampA((big+atk)/2+jit(key,"mot")),
    manManagement:clampA((poss+big)/2+jit(key,"mm")),
    determination:clampA(big-2+jit(key,"det")),
    discipline:clampA(def-3+jit(key,"dis")),levelOfDiscipline:clampA(def-1+jit(key,"lod")),
    fitness:clampA(70+jit(key,"fit")*2),adaptability:clampA((poss+counter)/2+jit(key,"ad")),
    technical:clampA((poss+atk)/2-4+jit(key,"tech"))
  };
  a.peopleManagement=clampA((a.manManagement+big)/2+jit(key,"pm"));
  return a;
}
function mgrOverall(a){return Math.round(0.25*a.tactical+0.16*(a.attacking+a.defending)/2+0.12*a.mental+0.12*a.motivating+0.1*a.determination+0.1*a.manManagement+0.08*a.peopleManagement+0.07*a.adaptability);}
function mgrValue(ovr,name){return Math.max(1,Math.round(0.0012*Math.pow(Math.max(1,ovr-40),3)*(0.9+0.2*rnd(name,"mv"))));}

/* ===== build ===== */
const players=[], managers=[]; let pi=0, mi=0;
for(const sq of SQUADS){
  const mkey=`${sq.club}|${sq.season}|${sq.mgr[0]}`;
  const ma=mgrAttrs(sq.mgr,mkey);const mov=mgrOverall(ma);
  managers.push({id:`m_${mi++}`,kind:"manager",name:sq.mgr[0],club:sq.club,season:sq.season,overall:mov,value:mgrValue(mov,sq.mgr[0]),...ma});
  for(const [name,pos,baseOvr] of sq.players){
    const key=`${sq.club}|${sq.season}|${name}`;
    const ovr=OVR_OVERRIDE[key]!==undefined?OVR_OVERRIDE[key]:baseOvr;
    players.push({id:`p_${pi++}`,kind:"player",name,club:sq.club,season:sq.season,primary:pos,secondaries:eligibleFor(name,pos),
      line:POS_LINE[pos],nationality:"",overall:ovr,value:valueFor(ovr,key,name),...playerAttrs(name,pos,ovr)});
  }
}

const CONFIG={budget:10000,startEachTeamSuggested:1000}; // £m; £10bn pot per player
const data={config:CONFIG,players,managers};
fs.writeFileSync("/home/claude/draft-zone-league/data.json", JSON.stringify(data));
fs.writeFileSync("/mnt/user-data/outputs/data.json", JSON.stringify(data));

const byLine={GK:0,DEF:0,MID:0,FWD:0}; players.forEach(p=>byLine[p.line]++);
console.log(`clubs:${SQUADS.length} players:${players.length} managers:${managers.length} budget:£${CONFIG.budget}m`);
console.log(`lines -> GK:${byLine.GK} DEF:${byLine.DEF} MID:${byLine.MID} FWD:${byLine.FWD}`);

let tpl=fs.readFileSync("/home/claude/draft-zone-league/draft-zone-league.html","utf8");
if(!tpl.includes("__DEFAULT_DATA__")) throw new Error("injection token missing");
tpl=tpl.replace("__DEFAULT_DATA__", JSON.stringify(data));
fs.writeFileSync("/mnt/user-data/outputs/index.html", tpl);
console.log("index.html built with embedded dataset");
