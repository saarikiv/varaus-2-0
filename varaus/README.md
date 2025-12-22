#### Atom:
> sudo add-apt-repository ppa:webupd8team/atom <br>
> sudo apt-get update <br>
> sudo apt-get install atom <br>
> sudo chown KÄYTTÄJÄ .atom/ -R

#### Atom paketit:
> apm install color-picker linter emmet file-icons react

#### Nodejs:
> sudo apt-get remove --purge nodejs <br>
> curl https://raw.githubusercontent.com/creationix/nvm/master/install.sh | bash <br>
> source ~/.profile <br>
> nvm install stable <br>
> nvm use stable

#### Github-repo:
> cd path/to/code <br>
> git clone https://github.com/saarikiv/varaus

#### Alustus:
> cd path/to/code/project <br>
> npm install

#### Käynnistä localhost:8080 ja buildaus:
> cd path/to/code/project <br>
> npm run dev

#### Deployment firebaseStageConfig
> asenna firebase työkalut
> $>npm install -g firebase-tools
> Käy valitsemassa src/index.html tiedostosta oikeat ympäristö konfiguraatiot
> Buildaa projekti $>NODE_ENV="production" webpack
> Testaa lokaalisti: $>firebase serve
> Valitse target: $>firebase use [production|stage]
> Depoly: $>firebase deploy

#### VARAUSSERVER
> Jos haluat käyttää ulkoista maksuserveriä
> aseta VARAUSSERVER osoittamaan serveriin, jota haluat käyttää (esim. varausserver.herokuapp.com)
> VARAUSSERVER on määritelty index.html:ssä


#### Avaa projekti atomilla:
> cd path/to/code/project <br>
> atom .

#### Käynnistä maksuserveri
> cd path/to/code/project <br>
> node src/server.js

#### HUOM! luo oma gitbranchi
> cd path/to/code/project <br>
> git checkout -b OMAN_BRANCHING_NIMI (esim tuomo_dev, kaapo_dev, kari_dev) <br>
> git push -u origin OMAN_BRANCHING_NIMI

#### Lisävinkkejä atomista:
- paina atomin sisällä [ctrl + ,] mene packages kohtaan ja kirjoita hakukenttään "tree" klikkaa tree-view paketin 'SETTINGS' nappia ja tikkaa "hide VCS ignored files" ja "hide ignored names". Jos tulee ikävä ignorattuja filejä voit käydä tikkaamassa pois.
- paina atomin sisällä [ctrl + ,] mene packages kohtaan ja kirjoita hakukenttään "autosave" kilkkaa autosave paketin 'SETTINGS' nappia ja tikkaa "enabled"

********************************************************************************

### Linkkejä:
- [React docs](https://facebook.github.io/react/docs/getting-started.html)
- [React tutorial](https://www.youtube.com/watch?v=MhkGQAoc7bc&list=PLoYCgNOIyGABj2GQSlDRjgvXtqfDxKm5b)
- [Redux docs](http://redux.js.org/)
- [Redux tutorial](https://egghead.io/lessons/javascript-redux-the-single-immutable-state-tree)
- [Firebase](https://console.firebase.google.com/)

********************************************************************************

## Projektista:
- Kaikki koodaus tapahtuu src hakemiston sisällä. Koodi buildaantuu kansioon public/ joka saattaa olla näkymättömissä, koska se on gitignoressa. Public on se mikä lähetetään hostaukseen.
- Src hakemiston sisällä on assets kansio mihin laitetaan mahdolliset staattiset kuvat (jpg, png, gif, svg...)
- Dev hakemistossa on kaikki javascriptkoodi liittyen reactiin ja reduxiin.
- Dev hakemiston sisällä react-komponentit ovat pääsääntöisesti kansiossa components, mutta sivuston pääelementit ovat kansiossa views. (viewsissä esim Homepage, Loginpage, Reservations, Shoppingcenter yms yms) (componentsissa esim Homepagen komponentit kansiossa homepage Navigation, Content, Contact, Footer yms yms)
- Styles hakemistossa on kaikki scss tiedostot. (huom ei css.) Kun lisää scss tiedoston hakemistoon, täytyy muistaa importata tiedosto app.scss tiedostossa. Ohjeet ovat siinä tiedostossa.
- app.js on äpin perusta. Kyseisessä tiedostossa on 'routing' hommat.
- index.html on äpin ainoa html tiedosto. Siihen ei näillä näkymin tarvitse koskea.
- Testit hakemistossa tests.
- Älä puske sekavia muutoksia .gitignoreen package.jsoniin webpack.config.jsään
