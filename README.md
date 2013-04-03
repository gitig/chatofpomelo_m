chatofpomelo_m
==============

Modified Version  

This version is based on [chatofpomelo](https://github.com/NetEase/chatofpomelo).  
#Configuration  
>`cd appDir` and `sh ./npm-install.sh`  
  
>`cd game-server && pomelo start`  
  
>`cd web-server && node app.js`  
  
#Tip  
If there is an error with log4js@0.6.2, please return back to log4js@0.5.7  
  
>`vim appDir/game-server/node_modules/pomelo/node_modules/pomelo-logger/package.json`  
>change the version of log4js to 0.5.7: "log4js":"=0.5.7"  
>reinstall: `npm install -d`  



