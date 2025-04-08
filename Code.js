const PROPERTIES = PropertiesService.getUserProperties()
const CALENDARS = CalendarApp.getAllCalendars()
let prevYear = new Date()
let nextYear = new Date()
prevYear.setDate(prevYear.getDate() - 360)
nextYear.setDate(nextYear.getDate() + 360)

function CoCo() {
  
}

function install(){
  ScriptApp.newTrigger('CoCo').forUserCalendar(Session.getActiveUser().getEmail()).onEventUpdated().create() 
}
function uninstall(){
  ScriptApp.deleteTrigger(ScriptApp.getProjectTriggers()[0])
}

function doGet(e) {
  const uri = e.pathInfo
  const output = ContentService.createTextOutput()
  output.setMimeType(ContentService.MimeType.JSON)
  const params = e.parameter
  let data

  switch (true) {
    case RegExp(`^Calendars$`).test(uri):

      data = CALENDARS.map(calendar => ({
        id : calendar.getId(),
        name : calendar.getName(),
        description : calendar.getDescription(),
        color : calendar.getColor(),
        timeZone : calendar.getTimeZone()
      }))

      break
      
    case RegExp(`^(${CALENDARS.map(calender => calender.getId()).join('|')})/Events$`).test(uri):

      const calendarId = uri.substring(0,uri.indexOf('/'))
      const calendar = CalendarApp.getCalendarById(calendarId);
      calendar.getEvents()
      const events = calendar.getEvents(dateVoidSetNow(params.startTime),dateVoidSetNow(params.endTime))

      data = mapEvents(events)
      break
    
    case RegExp(`^Events$`).test(uri):
      data = []
      for(const calendar of CALENDARS){
        const calendarData = {}
        calendarData[calendar.getId()] = mapEvents(calendar.getEvents(dateVoidSetNow(params.startTime),dateVoidSetNow(params.endTime)))
        data.push(calendarData)
      }

      break

    case RegExp(`^Properties$`).test(uri):
      data = PROPERTIES.getProperties()

      break

    default:
      
  }
  output.setContent(JSON.stringify(data))
  return output
}

function doPost(e) {
  const uri = e.pathInfo
  const data = JSON.parse((e.postData.contents? e.postData.contents: {}))
  switch (true) {
    case RegExp(`^Properties$`).test(uri):
      PROPERTIES.setProperties(data)
      break
    case RegExp(`^Install$`).test(uri):
      if(ScriptApp.getProjectTriggers().length > 0){
        break
      }
      install()
      break
    case RegExp(`^Uninstall$`).test(uri):
      if(ScriptApp.getProjectTriggers().length == 0){
        break
      }
      uninstall()
      break
  default:
  }
  return ContentService.createTextOutput('recieved: ' + e.postData.contents)
}

function mapEvents(events){
 let data = events.map(event => ({
        id: event.getId(),
        title: event.getTitle(),
        description: event.getDescription(),
        color: event.getColor(),
        eventType: event.getEventType(),
        creators: event.getCreators(),
        location: event.getLocation(),
        transparency: event.getTransparency(),
        startTime: event.getStartTime(),
        endTime: event.getEndTime(),
        tags:event.getAllTagKeys()
      }))
  return data
}

function dateVoidSetNow(date){
  return date? new Date(date): new Date()
}
