const PROPERTIES = PropertiesService.getUserProperties()
const CALENDARS = CalendarApp.getAllOwnedCalendars()
const CACHE = CacheService.getUserCache()
let prevYear = new Date()
let nextYear = new Date()
prevYear.setDate(prevYear.getDate() - 360)
nextYear.setDate(nextYear.getDate() + 360)

function CoCo(e) {
  if(CACHE.get('running')){
    return
  }
  try{
   const calendars = CalendarApp.getCalendarById(e.calendarId)
    setCalendarColors([calendars])
  }catch{
    
  }
}

function clearProperties(){
  PROPERTIES.deleteAllProperties()
}

function setCalendarColors(calendars){
  //stop execution if one process is already running
  if(CACHE.get('running')){
    return
  }
  CACHE.put('running',true,20)
  //get all properties
  const keys = PROPERTIES.getKeys()
  for(const calendar of calendars){  
    //for all calenders apply every key
    for(const key of keys){
      //parse value
      const value = JSON.parse(PROPERTIES.getProperty(key.toString()))
      //get all events
      const events = calendar.getEvents(prevYear,nextYear,{search: key})
      for(const event of events){
        if(value.hidden){
          event.deleteEvent()
          continue
        }
        // if color is already same skip setting process
        if(event.getColor() != value.color){
          // if color is unset and propertycolor is 0
          if(event.getColor() == "" && value.color == 0) {
            continue
          }
          try {
            event.setColor(value.color)
          } catch { //if there is a rate error
            Utilities.sleep(1000); //Rate-Limiter
            event.setColor(value.color) //and set then
          }
          continue
        }
      }
    }
  }

  CACHE.remove('running')
}
function doGet(e) {
  const uri = e.pathInfo
  const output = ContentService.createTextOutput()
  output.setMimeType(ContentService.MimeType.JSON)
  const params = e.parameter
  let data

  switch (true) {
    //Enpoint/Calendar
    case RegExp(`^Calendars$`).test(uri):
      //map values to json
      data = CALENDARS.map(calendar => ({
        id : calendar.getId(),
        name : calendar.getName(),
        description : calendar.getDescription(),
        color : calendar.getColor(),
        timeZone : calendar.getTimeZone(),
        registered: (ScriptApp.getProjectTriggers().filter(trigger => trigger.getTriggerSourceId() == calendar.getId()).length > 0)//does calendar Trigger exist
      }))

      break

    //Endpoint/calendarId/Events
    case RegExp(`^(${CALENDARS.map(calender => calender.getId()).join('|')})/Events$`).test(uri):
      //map events
      const calendarId = uri.substring(0,uri.indexOf('/'))
      const calendar = CalendarApp.getCalendarById(calendarId);
      const events = calendar.getEvents(dateVoidSetNow(params.startTime),dateVoidSetNow(params.endTime))

      data = mapEvents(events)
      break
    
    //Endpoint/Events
    case RegExp(`^Events$`).test(uri):
      data = []
      //build json
      for(const calendar of CALENDARS){
        const calendarData = {}
        calendarData[calendar.getId()] = mapEvents(calendar.getEvents(dateVoidSetNow(params.startTime),dateVoidSetNow(params.endTime)))
        data.push(calendarData)
      }

      break

    //Endpoint/Properties
    case RegExp(`^Properties$`).test(uri):
      data = PROPERTIES.getProperties()
        for(const key in data){
          data[key] = JSON.parse(data[key])
        } 

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

    //Enpoint/Properties
    case RegExp(`^Properties$`).test(uri):
      for(const key in data){
        //Properties only accept Map<String,String> so we convert json to string
        data[key] = JSON.stringify(data[key])
      }
      //reset properties
      PROPERTIES.deleteAllProperties()
      PROPERTIES.setProperties(data)
      calendars = CalendarApp.getAllOwnedCalendars().filter(calendar => registeredCalendars.includes(calendar.getId())) 
      //set colors after propertychange
      setCalendarColors(calendars)
      break
    
    //Enpoint/calendarId/Enable
    case RegExp(`^(${CALENDARS.map(calender => calender.getId()).join('|')})/Enable$`).test(uri):
      calendarId = uri.substring(0,uri.indexOf('/'))
      //if a trigger already exists do nothing
      if(ScriptApp.getProjectTriggers().filter(trigger => calendarId == trigger.getTriggerSourceId()).length > 0){
        break
      }
      //createTrigger
      ScriptApp.newTrigger('CoCo').forUserCalendar(calendarId).onEventUpdated().create()
      calendars = CalendarApp.getAllOwnedCalendars().filter(calendar => registeredCalendars.includes(calendar.getId())) 
      //set colors after trigger creation
      setCalendarColors(calendars)
      break
    case RegExp(`^(${CALENDARS.map(calender => calender.getId()).join('|')})/Disable$`).test(uri):
      calendarId = uri.substring(0,uri.indexOf('/'))
      //if no trigger exists do nothing
      if(ScriptApp.getProjectTriggers().filter(trigger => calendarId == trigger.getTriggerSourceId()).length == 0){
        break
      }
      //deleteTrigger
      ScriptApp.deleteTrigger(ScriptApp.getProjectTriggers().filter(trigger => calendarId == trigger.getTriggerSourceId())[0])
      break
    default:
  }
  return
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
