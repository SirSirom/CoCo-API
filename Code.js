const PROPERTIES = PropertiesService.getUserProperties()
const CALENDARS = CalendarApp.getAllCalendars()
let prevYear = new Date()
let nextYear = new Date()
prevYear.setDate(prevYear.getDate() - 360)
nextYear.setDate(nextYear.getDate() + 360)

function CoCo(e) {
  const calendars = CalendarApp.getCalendarById(e.calendarId) 
  setCalendarColors([calendars])
}

function setCalendarColors(calendars){
  const keys = PROPERTIES.getKeys()
  for(const calendar of calendars){  
    for(const key of keys){
      const value = JSON.parse(PROPERTIES.getProperty(key.toString()))
      const events = calendar.getEvents(prevYear,nextYear,{search: key})
      for(const event of events){
        if(value.hidden){
          event.deleteEvent()
          continue
        }
        if(event.getColor() != value.color){
          event.setColor(value.color)
          continue
        }
      }
    }
  }
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
        timeZone : calendar.getTimeZone(),
        registered: (ScriptApp.getProjectTriggers().filter(trigger => trigger.getTriggerSourceId() == calendar.getId()).length > 0)
      }))

      break
      
    case RegExp(`^(${CALENDARS.map(calender => calender.getId()).join('|')})/Events$`).test(uri):

      const calendarId = uri.substring(0,uri.indexOf('/'))
      const calendar = CalendarApp.getCalendarById(calendarId);
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
  const data = JSON.parse(e.postData.contents)
  const params = e.parameter
  let calendarId
  const registeredCalendars = ScriptApp.getProjectTriggers().map(trigger => trigger.getTriggerSourceId())
  let calendars
  switch (true) {
    case RegExp(`^Properties$`).test(uri):
      for(const key in data){
        data[key] = JSON.stringify(data[key])
      }
      PROPERTIES.deleteAllProperties()
      PROPERTIES.setProperties(data)
      calendars = CalendarApp.getAllOwnedCalendars().filter(calendar => registeredCalendars.includes(calendar.getId())) 
      setCalendarColors(calendars)
      break
    case RegExp(`^(${CALENDARS.map(calender => calender.getId()).join('|')})/Enable$`).test(uri):
      calendarId = uri.substring(0,uri.indexOf('/'))
      if(ScriptApp.getProjectTriggers().filter(trigger => calendarId == trigger.getTriggerSourceId()).length > 0){
        break
      }
      ScriptApp.newTrigger('CoCo').forUserCalendar(calendarId).onEventUpdated().create()
      calendars = CalendarApp.getAllOwnedCalendars().filter(calendar => registeredCalendars.includes(calendar.getId())) 
      setCalendarColors([calendarsId])
      break
    case RegExp(`^(${CALENDARS.map(calender => calender.getId()).join('|')})/Disable$`).test(uri):
      calendarId = uri.substring(0,uri.indexOf('/'))
      if(ScriptApp.getProjectTriggers().filter(trigger => calendarId == trigger.getTriggerSourceId()).length == 0){
        break
      }
      ScriptApp.deleteTrigger(ScriptApp.getProjectTriggers().filter(trigger => calendarId == trigger.getTriggerSourceId())[0])
      break
  default:
  }
  return ContentService.createTextOutput('recieved: ' + JSON.parse(e.postData.contents))
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
