const properties = PropertiesService.getUserProperties()

function CoCo() {
  let manuals = JSON.parse(JSON.stringify(getManual()).replaceAll('manualColor":','":'))
  properties.setProperties(manuals)
  Logger.log('[INIT] Loaded Current Manual Colors:')
  Logger.log(manuals)
  Logger.log('\n Full list now: \n')
  Logger.log(properties.getProperties())
  let prevYear = new Date()
  let nextYear = new Date()
  prevYear.setDate(prevYear.getDate() - 360)
  nextYear.setDate(nextYear.getDate() + 360)
  let calender = CalendarApp.getCalendarsByName('DHGE')[0]
  let events = calender.getEvents(prevYear,nextYear)
  for(let event of events){
    // if(blacklist.includes(event.getTitle())){
    //   event.deleteEvent()
    //   Logger.log('[DEL][' + event.getStartTime() + ']\n' + event.getTitle() + '" -> blacklist')
    //   continue
    // }
    // let color = properties.getProperty(event.getTitle())
    // if(!color){
    //   color = getRandomColor()
    //   properties.setProperty(event.getTitle(),color)
    //   Logger.log('[GEN][' + event.getStartTime() + ']\n' + event.getTitle() +  '" -> ' + color)
    // }
    // if(event.getColor() != color){
    //   event.setColor(color)
    //   Logger.log('[SET][' + event.getStartTime() + ']\n' + event.getTitle() +  '" -> ' + color)
    //   continue
    // }
    // Logger.log('[SKIP][' + event.getId() + event.getStartTime() + ']\n' + event.getTitle() + '" -> ' + event.getColor() + ' = ' + color)
    Logger.log(event.getId())
  }
}

function getManual(){
  let manuals = {}
  for (const key in properties.getProperties()){
    if(key.includes('manualColor')){
      manuals[key]= properties.getProperty(key)
    }
  }
  return manuals
}
function setManual(manual){
  properties.setProperties(manual)
}

function getBlacklist(){
  let blacklisted = []
  for (const key in properties.getProperties()){
    if(key.includes('blacklist')){
      blacklisted.push(key)
    }
  }
  return blacklisted
}

const manualColor = {
  'Spezielle Themen I  // Recht f. Ingen. // Nather':CalendarApp.EventColor.PALE_GREEN,
  'Spezielle Themen I Spezielle Themen I  // Recht f. Ingen. // Nather':CalendarApp.EventColor.PALE_GREEN,
  'Spezielle Themen I  // Dozent online // Nathe':CalendarApp.EventColor.PALE_GREEN,
  'Spezielle Themen I  // Dozent online // Nather':CalendarApp.EventColor.PALE_GREEN,
  'Spezielle Themen I Spezielle Themen I  // Dozent online // Nather':CalendarApp.EventColor.PALE_GREEN,
  'Systementwicklung // Systementw. // Kasche':CalendarApp.EventColor.RED,
  'Technische Informatik // AT-M-Vertiefung // Grimm': CalendarApp.EventColor.BLUE,
  'Technische Informatik Informationstechnik und Maschinenorientierte Programmierung // Architektur (1) // Grimm':CalendarApp.EventColor.PALE_BLUE,
  'Technische Informatik // ATMega // Grimm':CalendarApp.EventColor.CYAN,
  'ABWL und spezielle Managementfelder // spez. Managem.f // Bauer':CalendarApp.EventColor.GREEN,
  'ABWL und spezielle Managementfelder // spez.Managem.f. // Bauer':CalendarApp.EventColor.GREEN,
  'Spezielle Themen I // mob.Applikation // Kasche':CalendarApp.EventColor.MAUVE, 
  'Englisch // Englisch // Bonk':CalendarApp.EventColor.YELLOW,
  'Datenbanken // Datenbanken II // Dorendorf':CalendarApp.EventColor.GRAY
}

const blacklist = [
  'Spezielle Themen I // digit.Prod.entw // Herbst',
  'Spezielle Themen I // CloudComputing1 // Kasche',
  'Spezielle Themen I // Kryptographie // Kusche',
  'Spezielle Themen I // Simulationste // Feldmann',
  'Spezielle Themen I // EmbeddesSystem1 // Günther',
  'Spezielle Themen I // Simulationstech // Feldmann',
  'Spezielle Themen I // EmbeddedSystem1 // Günther'
]

function getRandomColor(){
  let eventColor = CalendarApp.EventColor
  let colors = [
    eventColor.BLUE,
    eventColor.RED,
    eventColor.CYAN,
    eventColor.GRAY,
    eventColor.GREEN,
    eventColor.MAUVE,
    eventColor.ORANGE,
    eventColor.PALE_BLUE,
    eventColor.PALE_GREEN,
    eventColor.PALE_RED,
    eventColor.RED,
    eventColor.YELLOW
  ]
  let random = Math.floor(Math.random() * colors.length)

  return colors [random]
}

function doGet(e){
    let uri = e.pathInfo
  switch (uri){
    case 'events':
      break
    default:
      let output = ContentService.createTextOutput()
      output.setContent(JSON.stringify(properties.getProperties()))
  }
  return output
}

function doPost(e){
  return ContentService.createTextOutput('recieved: '+e.postData.contents)
}
