'use strict';
    // Flatten only for ID lookup and booking validation; categories remain the source of truth.
    const services = serviceCategories.flatMap(category => category.services.map(service => ({
      ...service, categoryId: category.id, categoryName: category.name
    })));
    const BUSINESS_HOURS = {open:9, close:18, days:[1,2,3,4,5]};
    const $ = id => document.getElementById(id);
    // Calendar dates are local dates, avoiding UTC date shifts when opened locally.
    function dateKey(date){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;}
    function parseDate(key){const [y,m,d]=key.split('-').map(Number);return new Date(y,m-1,d);}
    function today(){const d=new Date();d.setHours(0,0,0,0);return d;}
    function formatDate(key,options={weekday:'short',day:'numeric',month:'short'}){return parseDate(key).toLocaleDateString('sv-SE',options);}
    function price(value){return `${value.toLocaleString('sv-SE')} ${CURRENCY}`;}
    function appointmentStart(key,time){const d=parseDate(key);const [h,m]=time.split(':').map(Number);d.setHours(h,m);return d;}
    function nextBusinessDay(offset=0){const d=today();d.setDate(d.getDate()+offset);while(!BUSINESS_HOURS.days.includes(d.getDay()))d.setDate(d.getDate()+1);return dateKey(d);}
    // SIMULATED DATA ONLY: freely edit date keys / occupied times. Stored in memory.
    const simulatedBookings = {
      [nextBusinessDay(0)]:['10:00','12:00','15:00'],
      [nextBusinessDay(3)]:['09:00','11:00','14:00'],
      [nextBusinessDay(5)]:['10:00','13:00','16:00']
    };
    let selectedService='';
    let selectedDate=nextBusinessDay();
    let selectedTime='';
    let displayedMonth=parseDate(selectedDate);displayedMonth.setDate(1);
    let lastBooking=null;
    const demoCancellation={date:nextBusinessDay(4),time:'11:00',service:services[0]||null};
    const currentService=()=>services.find(s=>s.id===selectedService);
    // DATA ADAPTERS: replace these three functions with real integrations in Phase 2.
    function getAvailableSlots(key){
      if(!BUSINESS_HOURS.days.includes(parseDate(key).getDay()))return [];
      const slots=[];
      for(let hour=BUSINESS_HOURS.open;hour+APPOINTMENT_DURATION/60<=BUSINESS_HOURS.close;hour++){
        const time=`${String(hour).padStart(2,'0')}:00`;
        const booked=(simulatedBookings[key]||[]).includes(time);
        const past=appointmentStart(key,time)<=new Date();
        slots.push({time,available:!booked&&!past,reason:booked?'Bokad':past?'Passerad':'Ledig'});
      }
      return slots;
    }
    function createBooking(data){
      if(!services.some(s=>s.id===data.serviceId)||!getAvailableSlots(data.date).some(s=>s.time===data.time&&s.available))throw new Error('Tiden är inte längre ledig. Välj en annan tid.');
      (simulatedBookings[data.date] ||= []).push(data.time);
      // Phase 2: data.message is the optional message for the calendar integration.
      // Do not retain contact details or messages in the simulated booking record.
      return {serviceId:data.serviceId,categoryId:services.find(service=>service.id===data.serviceId).categoryId,date:data.date,time:data.time};
    }
    function cancelBooking(token){
      if(token!=='demo-permitted')throw new Error('This demo cancellation link is invalid or expired.');
      if(!lastBooking||appointmentStart(lastBooking.date,lastBooking.time)-new Date()<24*60*60*1000)throw new Error('Cancellation is unavailable within 24 hours of the appointment.');
      simulatedBookings[lastBooking.date]=(simulatedBookings[lastBooking.date]||[]).filter(t=>t!==lastBooking.time);
      lastBooking=null;return true;
    }
    // Generate category headings and accessible treatment rows from the editable menu.
    function renderServices(){
      const list=$('service-list');list.replaceChildren();
      if(!serviceCategories.length){list.textContent='Vi uppdaterar vårt behandlingsutbud. Välkommen tillbaka snart.';return;}
      serviceCategories.forEach((category,index)=>{
        const section=document.createElement('section');section.className='service-category';
        const heading=document.createElement('h2');heading.id=`category-heading-${index}`;heading.textContent=category.name;
        section.setAttribute('aria-labelledby',heading.id);section.append(heading);
        if(!category.services.length){
          const empty=document.createElement('p');empty.className='category-empty';empty.textContent='Inga behandlingar tillgängliga i denna kategori just nu.';section.append(empty);
        }
        category.services.forEach(service=>{
          const button=document.createElement('button');button.type='button';button.className='service-row';
          button.setAttribute('aria-pressed',String(service.id===selectedService));
          const top=document.createElement('span');top.className='service-row-top';
          const name=document.createElement('span');name.className='service-row-name';name.textContent=service.name;
          const amount=document.createElement('span');amount.className='service-row-price';amount.textContent=price(service.price);
          const arrow=document.createElement('span');arrow.className='service-row-arrow';arrow.setAttribute('aria-hidden','true');arrow.innerHTML='<svg class="diagonal-arrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M6 18 18 6M6 6h12v12"/></svg>';
          top.append(name,amount,arrow);
          const description=document.createElement('span');description.className='service-row-description';description.textContent=service.description;
          const duration=document.createElement('span');duration.className='service-row-duration';duration.textContent=`${service.duration} minuter`;
          button.append(top,description,duration);
          button.addEventListener('click',()=>{selectedService=service.id;selectedTime='';showBooking();renderAll();$('flow-title').focus();});
          section.append(button);
        });list.append(section);
      });
    }
    // Guide narrow-screen users to the next step without opening the keyboard.
    function scrollToMobileStep(id){
      if(!window.matchMedia('(max-width: 700px)').matches)return;
      requestAnimationFrame(()=>{
        const target=$(id);
        if(!target || target.hidden)return;
        target.scrollIntoView({
          behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',
          block:'start'
        });
      });
    }
    // Calendar generation: weekends remain selectable so the closed state is explicit.
    function renderCalendar(){
      $('month-label').textContent=displayedMonth.toLocaleDateString('sv-SE',{month:'long',year:'numeric'});
      $('calendar').replaceChildren();
      ['M','T','O','T','F','L','S'].forEach(text=>{const label=document.createElement('span');label.className='weekday';label.textContent=text;$('calendar').append(label);});
      const offset=(displayedMonth.getDay()+6)%7;
      for(let i=0;i<offset;i++)$('calendar').append(document.createElement('span'));
      const count=new Date(displayedMonth.getFullYear(),displayedMonth.getMonth()+1,0).getDate();
      for(let day=1;day<=count;day++){
        const d=new Date(displayedMonth.getFullYear(),displayedMonth.getMonth(),day);const key=dateKey(d);
        const button=document.createElement('button');button.type='button';button.className='day'+(key===selectedDate?' chosen':'')+(key===dateKey(today())?' today':'');button.textContent=day;button.disabled=d<today();button.setAttribute('aria-pressed',String(key===selectedDate));button.setAttribute('aria-label',`${formatDate(key,{weekday:'long',day:'numeric',month:'long',year:'numeric'})}${!BUSINESS_HOURS.days.includes(d.getDay())?', kliniken stängd':''}`);
        button.addEventListener('click',()=>{selectedDate=key;selectedTime='';renderCalendar();renderAvailability();renderSummary();scrollToMobileStep('time-title');});$('calendar').append(button);
      }
      const firstThisMonth=today();firstThisMonth.setDate(1);$('prev-month').disabled=displayedMonth<=firstThisMonth;
    }
    function renderAvailability(){
      $('slots').replaceChildren();$('time-title').textContent=formatDate(selectedDate,{weekday:'short',day:'numeric',month:'long'});
      const slots=getAvailableSlots(selectedDate);
      if(!slots.some(slot=>slot.time===selectedTime&&slot.available))selectedTime='';
      slots.forEach(slot=>{const button=document.createElement('button');button.type='button';button.className='slot'+(selectedTime===slot.time?' chosen':'');button.disabled=!slot.available||!currentService();button.setAttribute('aria-pressed',String(selectedTime===slot.time));button.setAttribute('aria-label',`${slot.time}, ${slot.reason}`);button.innerHTML=`${slot.time}<small>${slot.reason}</small>`;button.addEventListener('click',()=>{selectedTime=slot.time;renderAvailability();renderSummary();scrollToMobileStep('contact-form');});$('slots').append(button);});
      $('availability-feedback').textContent=!services.length?'Bokningen öppnar när behandlingar har lagts till.':!slots.length?'Kliniken är stängd på helger. Välj en vardag.':!slots.some(s=>s.available)?'Inga lediga tider detta datum. Välj en annan dag.':`${currentService()?.duration ?? APPOINTMENT_DURATION} min behandling · Tider visas i enhetens lokala tidszon.`;
      $('contact-form').hidden=!selectedTime||!currentService();$('date-step').classList.toggle('active',!!selectedDate);$('details-step').classList.toggle('active',!!selectedTime);
    }
    function summaryRows(service,date,time){
      const fragment=document.createDocumentFragment();
      [['Kategori',service?.categoryName||'Ej vald'],['Behandling',service?.name||'Ej vald'],['Datum',date?formatDate(date,{day:'numeric',month:'long',year:'numeric'}):'Välj datum'],['Tid',time||'Välj tid'],['Behandlingstid',service?`${service.duration} min`:'—'],['Totalt',service?price(service.price):'—']].forEach(([label,value])=>{const row=document.createElement('div');row.className='summary-row'+(label==='Totalt'?' summary-price':'');const a=document.createElement('span');a.textContent=label;const b=document.createElement('span');b.textContent=value;row.append(a,b);fragment.append(row);});return fragment;
    }
    function renderSummary(){$('summary').replaceChildren(summaryRows(currentService(),selectedDate,selectedTime));}
    function renderAll(){renderServices();renderCalendar();renderAvailability();renderSummary();$('chosen-treatment-name').textContent=currentService()?.name||'';$('chosen-category-name').textContent=currentService()?.categoryName||'';}
    // Contact validation: only illustrative, fictional information should be entered.
    function validateContact(){
      const rules=[['message','message-error',v=>v.length<=1000,'Meddelandet får vara högst 1 000 tecken.'],['full-name','name-error',v=>v.trim().length>=2,'Ange ett demonamn med minst 2 tecken.'],['email','email-error',v=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),'Ange en giltig demo-e-post, t.ex. alex@example.com.'],['phone','phone-error',v=>/^[+()\d\s.-]+$/.test(v)&&v.replace(/\D/g,'').length>=7&&v.replace(/\D/g,'').length<=15,'Ange ett demonummer med 7–15 siffror.']];
      let valid=true;let firstInvalid;
      rules.forEach(([id,error,check,message])=>{const ok=check($(id).value);$(error).textContent=ok?'':message;$(id).setAttribute('aria-invalid',String(!ok));if(!ok){valid=false;firstInvalid ||= $(id);}});firstInvalid?.focus();return valid;
    }
    $('contact-form').addEventListener('submit',event=>{
      event.preventDefault();$('booking-error').textContent='';if(!validateContact())return;
      try{lastBooking=createBooking({serviceId:selectedService,date:selectedDate,time:selectedTime,message:$('message').value.trim()});$('message').value='';showConfirmation(lastBooking);}catch(error){$('booking-error').textContent=error.message;renderAvailability();renderSummary();}
    });
    function showConfirmation(booking){
      const service=services.find(s=>s.id===booking.serviceId);$('booking-flow').hidden=true;$('confirmation').hidden=false;
      $('confirmation').innerHTML='<div class="success-icon" aria-hidden="true">✓</div><div class="eyebrow" style="margin-bottom:12px">Demobokningen är klar</div><h2>Din demobokning<br>är bekräftad.</h2><p>Detta är en simulerad bokning. Inget riktigt besök eller e-post har skapats. Din demotid är nu upptagen under denna sidsession.</p><div class="success-details" id="confirmed-details"></div><button class="btn" id="book-again">Tillbaka till bokningen <svg class="diagonal-arrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M6 18 18 6M6 6h12v12"/></svg></button>';
      $('confirmed-details').append(summaryRows(service,booking.date,booking.time));$('book-again').addEventListener('click',()=>{selectedTime='';showBooking();renderAll();$('flow-title').focus();});$('confirmation').focus();renderCancellation('permitted');
    }
    function showBooking(){
      $('treatment-view').hidden=true;$('appointment-view').hidden=false;
      $('flow-title').textContent='Välj datum och tid.';
      $('flow-description').textContent='Välj en ledig tid som passar dig. Behandlingstid anges vid varje behandling.';
      $('confirmation').hidden=true;$('booking-flow').hidden=false;$('booking-error').textContent='';
    }
    function showTreatments(){
      selectedTime='';$('treatment-view').hidden=false;$('appointment-view').hidden=true;
      $('flow-title').textContent='Välj din behandling.';
      $('flow-description').textContent='Hitta rätt behandling för din hud. Behandlingstid anges vid varje behandling.';
      renderAll();$('flow-title').focus();
    }
    // Cancellation visual states. Preview examples never imply a real appointment.
    function renderCancellation(state){
      const panel=$('cancellation');panel.replaceChildren();const heading=document.createElement('h3');const text=document.createElement('p');
      const withinWindow=lastBooking&&appointmentStart(lastBooking.date,lastBooking.time)-new Date()<86400000;
      const booking=lastBooking||demoCancellation;const service=lastBooking?services.find(s=>s.id===lastBooking.serviceId):demoCancellation.service;
      const content={permitted:['Vill du avboka ditt besök?','Endast demoförhandsvisning. Avbokning måste göras minst 24 timmar före ditt besök. Bekräfta nedan för att simulera avbokning.'],late:['Det är för nära inpå ditt besök.','Avbokning är inte tillgänglig eftersom mindre än 24 timmar återstår. Avbokning måste göras minst 24 timmar före ditt besök. Detta är endast en visuell demo.'],invalid:['L?nken är inte längre tillgänglig.','Avbokningsl?nken är ogiltig eller har gått ut. Ingen bokning har ändrats. Detta är endast en visuell demo.'],success:['Din demobokning är avbokad.','Demoavbokningen är klar. Ingen riktig bokning eller e-post påverkades. Du kan välja en ny tid i bokningen.']};
      if(!content[state])state='invalid';heading.textContent=content[state][0];text.textContent=content[state][1];panel.append(heading,text);
      if(state==='permitted'||state==='late')panel.append(summaryRows(service,booking.date,booking.time));
      if(state==='permitted'){
        if(withinWindow){const note=document.createElement('p');note.textContent='Din senaste demobokning är inom 24 timmar. Här visas i stället ett separat exempelbesök längre fram.';panel.replaceChildren(heading,text);panel.append(summaryRows(demoCancellation.service,demoCancellation.date,demoCancellation.time),note);}
        const button=document.createElement('button');button.className='btn';button.textContent='Bekräfta demoavbokning';button.addEventListener('click',()=>{try{if(lastBooking&&!withinWindow)cancelBooking('demo-permitted');renderAvailability();renderSummary();renderCancellation('success');}catch(error){renderCancellation('invalid');}});panel.append(button);
      }
      if(state==='success'){const button=document.createElement('a');button.className='btn secondary';button.href='#booking';button.textContent='Boka en ny tid';button.addEventListener('click',showTreatments);panel.append(button);}
    }
    $('change-treatment').addEventListener('click',showTreatments);
    $('prev-month').addEventListener('click',()=>{displayedMonth.setMonth(displayedMonth.getMonth()-1);renderCalendar();});
    $('next-month').addEventListener('click',()=>{displayedMonth.setMonth(displayedMonth.getMonth()+1);renderCalendar();});
    document.querySelectorAll('[data-cancel]').forEach(button=>button.addEventListener('click',()=>renderCancellation(button.dataset.cancel)));
    $('year').textContent=new Date().getFullYear();renderAll();renderCancellation('permitted');
    const cancelState=new URLSearchParams(window.location.search).get('cancel');if(cancelState){$('cancel-demo').open=true;renderCancellation(cancelState);$('cancel-demo').scrollIntoView();}
    // Refresh past-time restrictions when returning to the page or crossing a minute.
    window.addEventListener('focus',()=>{renderCalendar();renderAvailability();renderSummary();});
    setInterval(()=>{renderCalendar();renderAvailability();renderSummary();},60000);
