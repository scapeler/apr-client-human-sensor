/*jslint devel: true,  undef: true, newcap: true, white: true, maxerr: 50 */
/*global APRI*/
/**
 * @module apri-human-sensor
 */

"use strict"; // This is for your code to comply with the ECMAScript 5 standard.

// ApriAppAir class def ===============================================================================
// parent: class ApriAppBase
var ApriAppHumanSensor = ApriApps.ApriAppHumanSensor = ApriApps.ApriAppHumanSensor || ApriApps.ApriAppBase.extend(function () {
	
	//initializer is executed before the constructor.
    this.initializer = function() {
		window.addEventListener('popstate', function(e) {
			// e.state is equal to the data-attribute of the last image we clicked
			console.log('popState/estate: ' + e.state);
			popState = true; 
			if (e.state) {
				console.log('popState: ' + e.state.pageName);
				goToPage(e.state.pageName);
			} else {
				getDeepLinkQuery();
				activateDeepLinkPage(); // goToPage('introPage');
			}	
			return true;
		});
    };

	var hidden, visibilityChange; 

	var apriCookieBase;
	var cookieLocationHistory;
	
	var apriForms;
	
	var appConfig = {};
	var secureSite;
	var siteProtocol, siteUrl, openiodUrl, socketUrl, socketPath, socketPort;
	var sitePrefixExtern;
	
	var apriConfig, apriClientInfo;
	var appBodyContainer, apriViewContainer;
	
	var locationMap, locationMapLayers;
	//, apriLeafLetBase;

	var templates;
	var refreshButton;
	
	var apriPages, pageName;
	
	var twm;
	var twmProgressBarIntervalId;
	var twmPrograssBarTotalTime;
	var twmPrograssBarTimeProcessed;

	
	var resultCategory;
	
	var viewBlocks;
	
	var viewFields;
	var apriAjaxBase;
	
	var deepLink, popState;
	
	var aireasAvgType; // 'UFP', 'PM1', 'PM25', 'PM10', 'SPMI', 'OZON', 'NO2', 'CELC', 'HUM', 'AMBHUM', 'AMBTEMP'
	
	var graphicTrend;
	var graphOptions;
	
	var parsedUrl;
	var geoLocation, geoLocationPrev, geoLocationMarker, geoLocationAutomatic;
	
	var RDres, RDcrs;
	
	
	var categories, categoryColor;
	var answerStatusOn, answerStatusOff,answerEscape;
	
	var introText,locationText,surveyText,succesText,resultText,aboutText;	
	
	//var introPage, locationPage, surveyPage, succesPage, resultPage, aboutPage;
	
	window.getDevicePixelRatio = function () {
    	var ratio = 1;
    	// To account for zoom, change to use deviceXDPI instead of systemXDPI
    	if (window.screen.systemXDPI !== undefined && window.screen.logicalXDPI       !== undefined && window.screen.systemXDPI > window.screen.logicalXDPI) {
        	// Only allow for values > 1
        	ratio = window.screen.systemXDPI / window.screen.logicalXDPI;
    	}
    	else if (window.devicePixelRatio !== undefined) {
        	ratio = window.devicePixelRatio;
    	}
       	ratio = Math.round(ratio*100)/100;
		
    	return ratio;
	};
	
	var resizeApp = function(e) {

		/* screen info */
		displayElements.screenInfoElement.classList.add('pixel-ratio-holder');
		var dprMethode2 = getDevicePixelRatio();
		displayElements.screenInfoElement.innerHTML = ' ('+window.innerWidth+'x'+window.innerHeight+'; dpr:'+dprMethode2+')';  //dpr1:'+jsPixelRatio()+';dpr2:'+dprMethode2+')';

//		var apriHeaderHeight = displayElements.apriMenuFixedElement.offsetHeight;
		
//		var appFooterTop = window.innerHeight-displayElements.apriMenuFooterFixedElement.offsetHeight;
//		displayElements.apriMenuFooterFixedElement.style.top = (appFooterTop) + 'px';
		
//		displayElements.apriPagesFixedElement.style.top = (apriHeaderHeight) + 'px';
//		displayElements.apriPagesFixedElement.style.height = (appFooterTop - apriHeaderHeight) + 'px';

//		for (var i=0;i<displayElements.apriPageElements.length;i++) {
//			displayElements.apriPageElements[i].style.height = (appFooterTop - apriHeaderHeight) + 'px';
//		}

//		var footerOffsetHeight, _top;
//		for (var i=0;i<displayElements.apriPageFooterElements.length;i++) {
//			footerOffsetHeight = displayElements.apriPageFooterElements[i].offsetHeight>0?displayElements.apriPageFooterElements[i].offsetHeight:footerOffsetHeight;
//			_top = (appFooterTop - apriHeaderHeight - footerOffsetHeight) + 'px';
//			displayElements.apriPageFooterElements[i].style.top = _top;
//		}

		/* pages */
//		for (var page in apriPages) {
//			if (apriPages[page].active==true) apriPages[page].container.style.height = (appFooterTop - apriHeaderHeight - footerOffsetHeight)+ 'px';
//		}
		return true;
		
	};
	
	var logLoadPerformance	= function() {
		// log start time performance
		var now = new Date().getTime();
		var page_load_time = now - performance.timing.navigationStart;
		console.log("User-perceived application loading time: " + page_load_time);
	};
	
	var displayElements;
	
	var loadModule = function(module, callBack) {
		apriController.loadObject(module, {} , callBack); //{container:appContainerSelector });
	};
	
	
	var source;
	
	var activateSocketIO	= function() {

//		var socket = io.connect(socketUrl, {port:socketPort, path:socketPath}); 
		var socket = io.connect(socketUrl, {path:socketPath}); 
		//var socket = io.connect(null,{port:socketPort, path:socketPath}); 
//		var socket = new io.Socket(null,{port:socketPort, path:socketPath});
//		socket.connect();
		
		socket.on( 'connected', function (data) {
			console.log('connected '+data);
		});
		socket.on( 'info', function (data) {
			//console.log('socket.io info: ' + data.nrOfConnections);
			displayElements.nrofconnections.setAttribute('nrofconnections',data.nrOfConnections);
		});

		socket.on( 'aireassignal', function (data) {
			var _signalData = data.data.signal;
			console.log('socket.io aireassignal: ' + _signalData);
			var messageText	= _signalData.signalDateTimeStr + ': ' + _signalData.message +' Nieuwe waarde: ' + _signalData.scaqi +'. ' + '<BR/>' + 'Wijk: '+ _signalData.wk_naam+'<BR/>'+'Gemeente: '+ _signalData.gm_naam;
			var icon		= apriConfig.urlSystemRoot+'/client/apri-client-human-sensor/images/aireas_logo.jpg';
			addNotification({text:messageText, type:'aireas',icon:icon, time:3600000});			
			//aant_inw gm_code scaqi_prev signalDateTime
		});


		socket.on( 'humansensordata', function (data) {
			//console.log(data);
			pushMessageHandler('humansensordata', data);
		});
		
		socket.on('message', function (data) {
			if(data.message) {
				console.log(data.message);
			//	messages.push(data.message);
			//	var html = '';
			//	for(var i=0; i<messages.length; i++) {
			//		html += messages[i] + '<br />';
			//	}
			//	content.innerHTML = html;
			} else {
				console.log("There is a problem:", data);
			}
		});
		
		//socket.emit('humansensordata', { message: 'testje' });
		//socket.emit('send', { message: 'testje send' });
		//socket.emit('message', { message: 'testje' });
	
	};
	
/*
	var activateEventSource	= function() {
		source = new EventSource('../eventsource/humansensor');
		source.addEventListener('humansensordata', pushMessageHandler, false);
//		source.addEventListener('open', pushMessageHandler, false);
//		source.addEventListener('message', pushMessageHandler, false);
//		source.addEventListener('error', pushMessageHandler, false);
		
		source.onopen = function(e) {
			console.log(e.type);
		}
		source.onmessage = function(e) {
			console.log(e.data);
		}
		source.onerror = function(e) {
			console.log(e.type);
		}

//		source.addEventListener('remove', removeHandler, false);
	};
*/
	var pushMessageHandler	= function(eventType, data) {
		
		var messageData 	= JSON.parse(data);
		var _eventType		= eventType;
		
		if (document.hidden == true ) {
			console.log('hidden: ' + document.visibilityState );
		} else {
			console.log('hidden: ' + document.visibilityState );
		}
		
		var _tmpDate		= new Date();
		var _tmpBegin 		= new Date(messageData.beginTime);
		var _tmpEnd 		= new Date(messageData.endTime);
		var _delayTime		= _tmpBegin.getTime() -  _tmpDate.getTime();
		_delayTime			= _delayTime>0?_delayTime:0;
		console.log('Message from server received at ' + _tmpDate );
        console.log('  Eventype: ' + eventType);
        console.log('  Delaytime: ' + _delayTime );		
        console.log('  Period: ' + _tmpBegin + ' - ' + _tmpEnd );		
        console.log('  Data: ' + data);

		setTimeout(activateAction, _delayTime, _eventType, messageData );
		

	};
	
	var activateAction	= function(eventType, messageData) {
		var _messageData	= messageData;
		if (eventType == "humansensordata") {
			if (twm.activeFaseId == undefined) {						// no active fase at this moment
				if (twm.fase[_messageData.actionType]&&twm.fase[_messageData.actionType].begin) {				// is fase function available?
					twm.activeFaseId		= _messageData.id;
					twm.activeActionType	= _messageData.actionType;
					twm.fase[_messageData.actionType].begin(_messageData);	// activate fase function
				}
			} else {
				twm.fase[twm.activeActionType].close();  // close previous action
				twm.activeFaseId			= undefined;
				twm.activeActionType		= undefined;
				if (twm.fase[_messageData.actionType]&&twm.fase[_messageData.actionType].begin) {
					twm.activeFaseId		= _messageData.id;
					twm.activeActionType	= _messageData.actionType;
					twm.fase[_messageData.actionType].begin(_messageData);
				}
			}
		}
	}
	
	
	
	
/* werkt niet op Android?!

	var notification = new Notification("New Email Received", { icon: "mail.png" })
	notification.onshow = function() { 
		setTimeout(notification.close, 15000) 
	};
*/

	
//	var jsPixelRatio= function() {
//		var el = document.querySelector('.pixel-ratio-holder');
//		return window.getComputedStyle(document.querySelector('.pixel-ratio-holder'), 'before').getPropertyValue('content').replace(/[^a-z]/g,'') * 1;
//	}
	
	this.constructor = function(objectId, options) {
		//Execute the constructor of the class we extended.
        this.super(objectId, options);
		
		apriConfig 		= APRI.getConfig();
		apriClientInfo 	= APRI.getClientInfo();
		//apriLeafLetBase = new ApriCore.ApriLeafLetBase();
		
		setHiddenProperty();
				
		geoLocation 			= {};
		geoLocationPrev			= {};
		
		setInterval(geoLocationAutomaticLoop, 2000);  // reset geolocationAutomatic every 2 sec



		console.log('App constructor popstate: ' + popState);
		if (popState==undefined) popState = false;
		
		
//		if (window.EventSource) { 
//			activateEventSource();
//		} else {
//			loadModule('eventsource', activateEventSource);
//		}

		/* Time Window Manager */ 
		twmInit();
		
		/* web-socket */
//		socketUrl 	= 'http://localhost:3010';
//		socketUrl 	= 'http://149.210.208.157:3010';
//		socketUrl 	= 'http://openiod.org';
//		socketUrl 	= 'https://openiod.org';
//		socketUrl 	= '';
//		socketPath	= apriConfig.urlSystemRoot + '/socket.io';

//prod:
		socketUrl 	= 'https://openiod.org'; socketPath	= apriConfig.urlSystemRoot + '/socket.io';

//test:
//		socketPort	= 3010; socketUrl 	= ':'+socketPort; 
//		socketPath	= apriConfig.urlSystemRoot + '/socket.io';


		console.log(socketUrl);
		
		
		initApriPages();

					
		// reset config from cookies
		apriCookieBase 					= new ApriCore.ApriCookieBase();
		var cookieLocationHistoryInput 	= apriCookieBase.getCookie('locationHistory');
		
		if (cookieLocationHistoryInput==undefined) {
			cookieLocationHistory = [];
		} else {
			cookieLocationHistory 			= JSON.parse(cookieLocationHistoryInput);
			setGeoLocation(cookieLocationHistory[0])
		}
//		if (cookieLocationHistory==undefined) {
//			cookieLocationHistory = [
//				{neighborhoodName:'testbuurt', neighborhoodCode:'testbucode'}
//				,{neighborhoodName:'testbuurt2', neighborhoodCode:'testbucode2'}
//				,{neighborhoodName:'testbuurt3', neighborhoodCode:'testbucode3'}
//			]
//		}

//		cookieLocationHistory = [
//			{neighborhoodName:'testbuurt', neighborhoodCode:'testbucode'}
//			,{neighborhoodName:'testbuurt2', neighborhoodCode:'testbucode2'}
//			,{neighborhoodName:'testbuurt3', neighborhoodCode:'testbucode3'}
//		]

		
		initDeepLink();
		
		
		locationMapLayers = {};
		appConfig.viewZoomLevel 		= 13;

		// init geoLocation
		setGeoLocation({
			  cityCode: 		''
			, cityName: 		''
			, neighborhoodCode: ''
			, neighborhoodName: ''
			, lat: 				51.45401
			, lng: 				5.47668
			, automatic:		false
			, manual:			false
			, lastTimeSet:		new Date(0)
		})	


		
		secureSite 			= true;
		siteProtocol 		= secureSite?'https://':'http://';
		siteUrl				= siteProtocol + 'scapeler.com' + apriConfig.urlSystemRoot; //SCAPE604';
		openiodUrl			= siteProtocol + 'openiod.org' + apriConfig.urlSystemRoot; //SCAPE604';
//		openiodUrl			= siteProtocol + 'localhost:4000/SCAPE604';
		sitePrefixExtern	= 'openiod.org/extern/'; //'scapeler.com/extern/'
		displayElements		= {};
		
		
		apriForms 			= {};
		
		answerStatusOn		= 'on';
		answerStatusOff		= 'off';
		answerEscape		= 'escape';
		
		categories			= [
			  {category: { id:"airquality", label:"Lucht", question:"Hoe ervaart u de luchtkwaliteit?"
			  	, answers: [
					  {id:'01', label:'Goed'		, color:'green', className:'answer-1of3', score:1, status:'off' }
			  		, {id:'02', label:'Neutraal'	, color:'yellow', className:'answer-2of3', score:2, status:'off' }
			  		, {id:'03', label:'Slecht'		, color:'red', className:'answer-3of3', score:3, status:'off' }
//			  		, {id:'escape', label:'nvt'		, color:'grey', className:'answer-escape', score:0, status:'on' }
					]
				}}
			, {category: { id:"noicestress", label:"Geluid", question:"Heeft u last van omgevingsgeluiden?"
			  	, answers: [
					  {id:'01', label:'Nee'			, color:'green', className:'answer-1of3', score:1, status:'off' }
			  		, {id:'02', label:'Neutraal'	, color:'yellow', className:'answer-2of3', score:2, status:'off' }
			  		, {id:'03', label:'Ja'			, color:'red', className:'answer-3of3', score:3, status:'off' }
//			  		, {id:'escape', label:'nvt'		, color:'grey', className:'answer-escape', score:0, status:'on' }
					]
				}}
			, {category: { id:"trafficstress", label:"Verkeer", question:"Heeft u last van verkeer in uw omgeving?"
			  	, answers: [
					  {id:'01', label:'Nee'			, color:'green', className:'answer-1of3', score:1, status:'off' }
			  		, {id:'02', label:'Neutraal'	, color:'yellow', className:'answer-2of3', score:2, status:'off' }
			  		, {id:'03', label:'Ja'			, color:'red', className:'answer-3of3', score:3, status:'off' }
//			  		, {id:'escape', label:'nvt'		, color:'grey', className:'answer-escape', score:0, status:'on' }
					]
				}}
			, {category: { id:"stress", label:"Stress", question:"Ervaart u stress?"
			  	, answers: [
					  {id:'01', label:'Nee'			, color:'green', className:'answer-1of3', score:1, status:'off' }
			  		, {id:'02', label:'Neutraal'	, color:'yellow', className:'answer-2of3', score:2, status:'off' }
			  		, {id:'03', label:'Ja'			, color:'red', className:'answer-3of3', score:3, status:'off' }
//			  		, {id:'escape', label:'nvt'		, color:'grey', className:'answer-escape', score:0, status:'on' }
					]
				}}
			, {category: { id:"odorstress", label:"Geur", question:"Ervaart u geurhinder?"
			  	, answers: [
					  {id:'01', label:'Nee'			, color:'green', className:'answer-1of3', score:1, status:'off' }
			  		, {id:'02', label:'Neutraal'	, color:'yellow', className:'answer-2of3', score:2, status:'off' }
			  		, {id:'03', label:'Ja'			, color:'red', className:'answer-3of3', score:3, status:'off' }
//			  		, {id:'escape', label:'nvt'		, color:'grey', className:'answer-escape', score:0, status:'on' }
					]
				}}

		];
		
		
		categoryColor 				= {};
		for (var i=0; i<categories.length;i++) {
			var _category	= categories[i].category;
			categoryColor[_category.id]	= {};
			for (var j=0;j<	_category.answers.length;j++) {
				var _answer = _category.answers[j];
				categoryColor[_category.id][_answer.id]	= _answer.color;
			}
		}

		
		introText 		= '<H2>Vliegveld Eindhoven sluit,<BR/>AiREAS onderzoekt effect op de mens</H2><img src="'+apriConfig.urlSystemRoot+'/client/apri-client-human-sensor/images/vliegtuig.jpg"></img><BR/>Het vliegveld van Eindhoven gaat twee weken dicht.<BR/>Twee weken lang niet vliegen, geen verkeer van en naar de luchthaven, alleen 400 vrachtwagens die de start en landingsbaan moeten vernieuwen met asfalt.<BR/><BR/>Dat is een eenmalige kans voor samenwerkingsverband “gezonde gebiedsontwikkeling” AiREAS om eens te kijken wat het effect is van zo´n vliegveld op de mens en omgeving door vóór, tijdens en na de sluiting dat te onderzoeken op gebied van luchtverontreiniging, geluid, stress en gezondheid.<BR/><BR/>De mogelijke unieke contrasten kunnen ons helpen een beeld te scheppen van wat er nodig zou zijn om middels de innovatiekracht van onze Brainport regio te komen tot een zo´n goed mogelijke mobiliteit­oplossing binnen de kaders van een zo gezond mogelijke en leefbare leefomgeving.<BR/><BR/><a href="https://aireas.wordpress.com/2016/04/28/vliegveld-eindhoven-sluit-aireas-onderzoekt-effect-op-de-mens/" target="_blank">Meer informatie</a><BR/><BR/>'; 

		locationText 	= '<H2>In welke buurt bevindt u zich?</H2>U kunt hier uw locatie aangeven.<BR/>Indien de locatie op de kaart niet helemaal juist is, kunt u de marker verplaatsen naar de buurt waarvan u uw beleving wilt aangeven.<BR/><BR/>'   
	
		surveyText		= '<H2>Vragenlijst</H2>Hier kunt u uw beleving van de leefomgeving per categorie aangeven.';
		
		succesText 		= '<H2>Bedankt voor uw deelname</H2>Uw antwoorden op de vragen over de beleving van de leefomgeving zijn belangrijk voor het onderzoek. Wij nodigen u vooral uit om deze vragen vaker te beantwoorden, zeker als daar aanleiding toe is. <BR/><BR/>Ga door naar de volgende pagina om de resultaten van de afgelopen periode te kunnen bekijken. Het duurt ongeveer een minuut voordat uw gegevens daarin zijn verwerkt.<BR/><BR/><BR/>'; 

		resultText 		= '<H2>Hoe doet uw buurt het?</H2>TEST! Dit zijn de resultaten van de afgelopen periode. Het kan even duren voordat uw reactie verwerkt is en hier in beeld komt. Gebruik de "Vernieuw data" knop om nieuwe data op te halen.<BR/></BR>'; 


		aboutText 		= '<H2>Project AiREAS Airport</H2>Het vliegveld van Eindhoven gaat twee weken dicht.<BR/>Twee weken lang niet vliegen, geen verkeer van en naar de luchthaven, alleen 400 vrachtwagens die de start en landingsbaan moeten vernieuwen met asfalt. <BR/><BR/>Dat is een eenmalige kans voor samenwerkingsverband “gezonde gebiedsontwikkeling” AiREAS om eens te kijken wat het effect is van zo´n vliegveld op de mens en omgeving door vóór, tijdens en na de sluiting dat te onderzoeken op gebied van luchtverontreiniging, geluid, stress en gezondheid.<BR/>De mogelijke unieke contrasten kunnen ons helpen een beeld te scheppen van wat er nodig zou zijn om middels de innovatiekracht van onze Brainport regio te komen tot een zo´n goed mogelijke mobiliteit­oplossing binnen de kaders van een zo gezond mogelijke en leefbare leefomgeving.<BR/><BR/>';


/*
			var contentElement = document.createElement('div');
			var imgElement = document.createElement('img');
			imgElement.setAttribute('width', '90%');
			imgElement.setAttribute('src', siteProtocol+sitePrefixExtern+'www.aireas.com/wp-content/uploads/2014/01/JWK_7314-5-copy.jpg');
			contentElement.appendChild(imgElement);
*/
		
				
		
		getDeepLinkQuery();

		
		appBodyContainer = document.getElementsByClassName('apri-app-body apri-client-human-sensor')[0];

		
		apriAjaxBase 	= new ApriCore.ApriAjaxBase();
		
/*
		window.onbeforeunload = function(e) {
			if (apriPages.surveyPage.active == true) {
				e.preventDefault();
				return "Are you sure you want to navigate away?";
			}
		};
*/
//		window.onunload = function(e) {
//			e.preventDefault();
//			return "Are you sure you want to navigate away2?";
//		};
		
		document.addEventListener("apriResize",resizeApp);

		this.initView();

//		loadModule('socketio', activateSocketIO);
		activateSocketIO();				

	}


	var setDeepLinkQuery 	= function() {
		var first		= '';
		deepLink.query 	= '';
		for (var parameter in deepLink.parameters) {
			deepLink.query += first + parameter + '=' + deepLink.parameters[parameter];
			first			= '&';
		}		
		if (deepLink.query != deepLink.prevQuery) {
			if (deepLink.prevQuery != undefined) {
				setPushState();
			}	
			deepLink.prevQuery = deepLink.query;
		}
	}
	var getDeepLinkQuery 	= function() {
		initDeepLink();
		var i = 0; 
		var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
			//if (key == 'dltype') return; //future extension eg. for encrypted deeplink variables
			deepLink.parameters[key]	= value;
		});
		return;
	};
	var setPushState = function() {
		var query;
		var _areaIndex = "";
		var dltype = "1";	// deeplink type = '1'=standard, future: encoded dltype?
		query = deepLink.query + '&dltype=' + dltype;
		console.log('pushstate: ' + deepLink.parameters.pageName);

		window.history.pushState({apri:'human-sensor', pageName: deepLink.parameters.pageName}, '/SCAPE604/app/human-sensor', '?' + query);
	};
	

	var setGeoLocation	= function (newGeoLocation) {
		geoLocationPrev					= geoLocation;
//		if (geoLocationPrev.marker) {
//			apriPages.locationPage.geoLocationMap.removeLayer(geoLocationPrev.marker);
//		}
		//if (geoLocationPrev.marker) apriPages.locationPage.geoLocationMap.removeLayer(geoLocationPrev.marker);
		geoLocation						= {};
		geoLocation.cityCode			= newGeoLocation.cityCode;
		geoLocation.cityName			= newGeoLocation.cityName;
		geoLocation.neighborhoodCode	= newGeoLocation.neighborhoodCode;
		geoLocation.neighborhoodName	= newGeoLocation.neighborhoodName;
		geoLocation.lat					= newGeoLocation.lat;
		geoLocation.lng					= newGeoLocation.lng;
		geoLocation.manual				= newGeoLocation.manual;
		geoLocation.automatic			= newGeoLocation.automatic;
		
		//apriPages.locationPage.gotoLocation(apriPages.locationPage.geoLocationMap);
	};

	//===========================================================================  end of constructor

	this.initView = function() {

		templates = {};
		viewBlocks = {};
		viewFields = {};
		
		var self = this;
		
		var _template = 'human-sensor';
		this.getTemplate(_template, {urlSystemRoot: apriConfig.urlSystemRoot, appPath: 'client/', app: 'human-sensor' }, {}, function(result) {
			templates[_template] 	= Handlebars.compile(result);
			var context 			= {title: "My New Post", body: "This is my first post!"};
			var html    			= templates[_template](context);
			
					
			displayElements.viewContainer				= document.createElement('div');
			displayElements.viewContainer.className 	= 'apri-view-container';
			displayElements.viewContainer.innerHTML 	= html;
			appBodyContainer.appendChild(displayElements.viewContainer);
			
			templates.categoryTemplate 				= appBodyContainer.getElementsByClassName("apri-human-sensor-template-category")[0];
			templates.categoryTemplate.classList.remove("apri-human-sensor-template-category");
			templates.notificationTemplate 			= appBodyContainer.getElementsByClassName("apri-human-sensor-template-notification")[0];
			templates.notificationTemplate.classList.remove("apri-human-sensor-template-notification");


			
			displayElements.nrofconnections 		= appBodyContainer.getElementsByClassName("nrofconnections")[0];
			displayElements.nrofconnections.addEventListener('click', function(e) {
				addNotification({text:'Dit geeft het aantal actieve gebruikers aan.', type:'info'});
			});
			
			displayElements.notifications 			= appBodyContainer.getElementsByClassName("notifications")[0];
			displayElements.progressBar 			= appBodyContainer.getElementsByClassName("progressbar-bar")[0];
			displayElements.twmProgressBar 			= appBodyContainer.getElementsByClassName("twm-progressbar-bar")[0];
			
			/* screeninfo */
			displayElements.screenInfoElement 			= document.getElementById("apriscreeninfo");
			/* height app header fixed menu */
			displayElements.apriMenuFixedElement 		= appBodyContainer.getElementsByClassName("apri-menu-fixed")[0];
			/* position app footer */
			displayElements.apriMenuFooterFixedElement 	= appBodyContainer.getElementsByClassName("apri-menu-footer-fixed")[0];
			
			
			//var _innerHTML = 'Ga door';
			var _navElement 		= appBodyContainer.getElementsByTagName("nav")[0];
			var _navActionsElements = _navElement.getElementsByClassName("apri-page-actions");
			for (var i=0;i<_navActionsElements.length;i++) {
				var _navActionsElement = _navActionsElements[i];
				var nextPagePage = _navActionsElement.getAttribute('nextpage');
				if (nextPagePage) {
				//	var nextPageElement = document.createElement('div');
				//	nextPageElement.innerHTML = _innerHTML;
				//	nextPageElement.className	= 'page-action-button'
				//	nextPageElement.setAttribute('nextpage',nextPagePage);
				//	_pageActionsElement.appendChild(nextPageElement);
					_navActionsElement.addEventListener('click', nextPage, false);
				}
			}		
			
			/* position pages */
			displayElements.apriPagesFixedElement 		= appBodyContainer.getElementsByClassName("apri-view-pages")[0];
			/* height per page */
			displayElements.apriPageElements 			= appBodyContainer.getElementsByClassName("apri-page");
			/* position pages footer */
			displayElements.apriPageFooterElements 		= appBodyContainer.getElementsByClassName("apri-page-footer");


			
			/* pages */
			/* intro page */
//			apriPages.introPage.container				= appBodyContainer.getElementsByClassName("introPage")[0];
//			apriPages.introPage.init();
			/* geolocation page */
//			apriPages.locationPage.container			= appBodyContainer.getElementsByClassName("locationPage")[0];
//			apriPages.locationPage.init();
			/* survey page */
//			apriPages.surveyPage.container				= appBodyContainer.getElementsByClassName("surveyPage")[0];
//			apriPages.surveyPage.init();
			/* succes page */
//			apriPages.succesPage.container				= appBodyContainer.getElementsByClassName("succesPage")[0];
//			apriPages.succesPage.init();
			/* result page */
//			apriPages.resultPage.container				= appBodyContainer.getElementsByClassName("resultPage")[0];
//			apriPages.resultPage.init();
			/* about page */
//			apriPages.aboutPage.container				= appBodyContainer.getElementsByClassName("aboutPage")[0];
//			apriPages.aboutPage.init();
			
									

		
			
//			viewManager.parseViewBlocks(document.body);
			
			
			displayElements.mainMenuButton 	= appBodyContainer.getElementsByClassName("menu-btn")[0];
			displayElements.menuButtons 	= appBodyContainer.getElementsByClassName("responsive-menu"); 
//			displayElements.mainMenuButton.addEventListener('click', expandMenu, false);
			displayElements.apriMenuFixedElement.addEventListener('click', expandMenu, false);
						

			activateDeepLinkPage();


			resizeApp();

/*
		apriForms.filters = document.getElementsByClassName('apri-form aireas-stats-filters')[0];
		apriForms.filters.formComponentsHtml = apriForms.filters.getElementsByClassName('apri-form-component');
		apriForms.filters.formComponents = {};
		for (var fcI=0;fcI<apriForms.filters.formComponentsHtml.length;fcI++) {
			var _formComponentHtml = apriForms.filters.formComponentsHtml[fcI];
			var _name = _formComponentHtml.getAttribute("name");
			apriForms.filters.formComponents[_name] = {};
			apriForms.filters.formComponents[_name].element = _formComponentHtml;	
		}
	
		
		var _elementAbortRetrievalButton = apriForms.filters.formComponents['abortRetrieval'].element.getElementsByTagName('div')[0];
		_elementAbortRetrievalButton.addEventListener('click', function(event) {
			apriAjaxBase.abort();
			alert('aborted');
  		}, false); 
		
		var _elementSelect = apriForms.filters.formComponents['avgPerYearMonthDaySelect'].element.getElementsByTagName('select')[0];
		
		_elementSelect.addEventListener('change', function(event) {
    		//alert( 'test' );
//			graphOptions.histYear 		= aireasHistYear;

//			setOptionsParameters();			
			
			initGraphicTrend(graphOptions);

			
  		}, false); 
		
		for(var i=0;i<_elementSelect.length;i++) { 
			if(_elementSelect[i].value==avgPerPeriod) {
				_elementSelect[i].setAttribute("selected","selected"); 
				break;
			}
		}


		var _elementSensorSelect = apriForms.filters.formComponents['sensorSelect'].element.getElementsByTagName('select')[0];
		
		_elementSensorSelect.addEventListener('change', function(event) {
 			aireasAvgType		= this.value;
			graphOptions.sensor = aireasAvgType;

			setOptionsParameters();			
			
			initGraphicTrend(graphOptions);

			
  		}, false); 
		
		for(var i=0;i<_elementSensorSelect.length;i++) { 
			if(_elementSensorSelect[i].value==aireasAvgType) {
				_elementSensorSelect[i].setAttribute("selected","selected"); 
				break;
			}
		}

*/

		
		apriViewContainer = document.getElementsByClassName('apri-view-body')[0];
		

	

		var graphicTrendContainer = document.createElement('div');
		apriViewContainer.appendChild(graphicTrendContainer);
		
//		graphOptions.area 			= aireasArea;
//		graphOptions.airbox 		= aireasAirbox;

//		graphOptions.url = "http://openiod.com/SCAPE604/openiod?SERVICE=WPS&REQUEST=Execute&identifier=observation_aireas_average";

//		setOptionsParameters();			
		
//		graphOptions.container = graphicTrendContainer;
//		initGraphicTrend(graphOptions);


		logLoadPerformance();
		
		}, null);
			
	}
	
	var expandMenu 	= function(e) {
		for (var i=0;i<displayElements.menuButtons.length;i++) {
			displayElements.menuButtons[i].classList.toggle("expand");
		}			
	}
	var hideMenu 	= function(e) {
		for (var i=0;i<displayElements.menuButtons.length;i++) {
			displayElements.menuButtons[i].classList.remove("expand");
		}			
	}
	
	var buttonPushed = function (e) {
		var buttons = this.parentElement.getElementsByClassName('apri-category-answer');
		for (var i=0;i<buttons.length;i++) {
			buttons[i].classList.remove('apri-category-answer-status-on');
			buttons[i].classList.remove('apri-category-answer-status-off');
			if (buttons[i]==this) {
				if (this.getAttribute('answerStatus') == answerStatusOn) {
					this.classList.add('apri-category-answer-status-off');
					this.setAttribute('answerStatus', answerStatusOff );
				} else {
					this.classList.add('apri-category-answer-status-on');
					this.setAttribute('answerStatus', answerStatusOn );
				}
			} else {
				buttons[i].classList.add('apri-category-answer-status-off');
				buttons[i].setAttribute('answerStatus', answerStatusOff );
			}
		}
		return true;
	};
	
	function ajaxGetData(url, callback ) {
		
		
		var xmlhttp;
		xmlhttp=new XMLHttpRequest();
		xmlhttp.onreadystatechange=function() {
			console.log('onreadychange');
  			if (xmlhttp.readyState==1) {
				displayElements.progressBar.parentElement.classList.add('enabled');
				displayElements.progressBar.style.width = '10%';				
			}	
  			if (xmlhttp.readyState==2) displayElements.progressBar.style.width = '20%';
  			if (xmlhttp.readyState==3) displayElements.progressBar.style.width = '30%';
  			if (xmlhttp.readyState==4 && xmlhttp.status==200) {
				callback(xmlhttp.responseText);
			}
  			if (xmlhttp.readyState==4) {
				setTimeout(function() {
					displayElements.progressBar.parentElement.classList.remove('enabled');
				},500);
				
			}

  			if (xmlhttp.readyState==4 && xmlhttp.status==0) {
				callback(xmlhttp.responseText); // no internet connection
			}
  		}
		xmlhttp.open("GET",url,true);
		xmlhttp.onloadstart = function(pe) {
			console.log('onloadstart');
//			displayElements.progressBar.max = pe.total;
//			displayElements.progressBar.value = 0;
//			displayElements.progressBar.style.width = (pe.loaded/pe.total)*100+'%';
		}
		xmlhttp.onprogress = function(pe) {
			console.log('onprogress');
			if(pe.lengthComputable) {
	//			displayElements.progressBar.max = pe.total;
	//			displayElements.progressBar.value = pe.loaded;
				displayElements.progressBar.style.width = (pe.loaded/pe.total)*100+'%';
			} else {
				//displayElements.progressBar.style.width = pe.loaded/50+'%';
				//displayElements.progressBar.style.width = pe.loaded/50+'px';
				displayElements.progressBar.style.width = (pe.loaded/pe.total)*100+'%';
			}	
		}
		xmlhttp.onloadend = function(pe) {
			console.log('onloadend');
			//displayElements.progressBar.value = pe.loaded;
			//displayElements.progressBar.style.width = 0; //pe.loaded/50+'px';
			displayElements.progressBar.style.width = 100+'%'; //pe.loaded/50+'px';
		}
		xmlhttp.send();
	}


	var nextPage = function (e) {
		var _nextPage;
		_nextPage = this.getAttribute("nextPage")
		
		hideMenu();
		//e.preventDefault();
		e.stopPropagation();
		
		goToPage(_nextPage);
			
		return true;	
				
	};
	
	var goToPage	= function(inPageName) {
		var pageToActivate;

		for (var page in apriPages ) {
			deActivatePage(apriPages[page]);
//			if (apriPages[page].active == true) {
//				apriPages[page].deactivate();
//			}
			if (page == inPageName) {
				pageToActivate 		= page;
			}
		}
		if (pageToActivate) 	apriPages[pageToActivate].activate();	

	}
	
	var deActivatePage	= function(page) {
		if (page.active == true) {
			page.deactivate();
	//		if (page.linkedPage) { 		// alles wordt al gedeactiveerd)
	//			for (var pageKey in page.linkedPage) {
	//				deActivatePage(apriPages[pageKey]);
	//			}
	//		}
		}
	}
	
	var initDeepLink	= function() {
		deepLink 			= {};
		deepLink.parameters	= {};
		deepLink.query		= '';
	}	

	var activateDeepLinkPage	= function() {
		if (deepLink.parameters.pageName && (
			deepLink.parameters.pageName =='introPage' ||
			deepLink.parameters.pageName =='locationPage' ||
			deepLink.parameters.pageName =='surveyPage' ||
			deepLink.parameters.pageName =='succesPage' ||
			deepLink.parameters.pageName =='resultPage' ||
			deepLink.parameters.pageName =='aboutPage'
			)) {
			console.log('Deeplink page: ' + deepLink.parameters.pageName);
			//apriPages[deepLink.parameters.pageName].activate();
			goToPage(deepLink.parameters.pageName);
			
		} else {
			console.log('Activate default page IntroPage');
			goToPage('introPage');
		}	
	}
	
	var sendButtonPushed = function () {
		var responseAvailable = false;
		var data = {};
		data.neighborhoodCode	= geoLocation.neighborhoodCode;  	
		data.neighborhoodName	= geoLocation.neighborhoodName;	
		data.cityCode			= geoLocation.cityCode;	
		data.cityName			= geoLocation.cityName;
		
		data.categories			= [];
		data.observation		= '';
		

		var apriCategories	= apriPages.surveyPage.displayElements.pageCategoriesContainerElement.getElementsByClassName('apri-category-container');
		for (var i=0;i<apriCategories.length;i++) {
			var tmpCategory = {};

			var _category 	= apriCategories[i];
			tmpCategory.id	= _category.getAttribute('categoryid');
			
			var _answers 	= _category.getElementsByClassName('apri-category-answer');
			for (var j=0;j<_answers.length;j++) {
				var _answer = _answers[j];
				if (_answer.getAttribute('answerstatus')==answerStatusOn && _answer.getAttribute('answerid')!=answerEscape) {
					tmpCategory.observation	= _answer.getAttribute('answerid');
					data.categories.push(tmpCategory);
					if (data.observation != '') data.observation = data.observation + ',';
					data.observation = data.observation + tmpCategory.id + ':' + tmpCategory.observation;
					responseAvailable		= true;
				}			
			}
			
		}
		
		if (twm.activeFaseId && twm.activeFaseId == 'A002B' && twm.fase[twm.activeActionType].actionStatus == 'gold') {
			data.actionStatus	= twm.fase[twm.activeActionType].actionStatus;
			twm.fase[twm.activeActionType].actionStatus	= undefined;				// clear action status, only one observation per 'gold' period
		}
		
		if (responseAvailable) {
			sendData(data); 


			var _newLocation 				= {};
			_newLocation.cityCode			= geoLocation.cityCode;
			_newLocation.cityName			= geoLocation.cityName;
			_newLocation.neighborhoodCode	= geoLocation.neighborhoodCode;
			_newLocation.neighborhoodName	= geoLocation.neighborhoodName;
			_newLocation.lat				= geoLocation.lat;
			_newLocation.lng				= geoLocation.lng;
						
			var newCookieLocationHistory	= [];
			newCookieLocationHistory.push(_newLocation);
			
			if (cookieLocationHistory) {
				for (var i=0;(i<cookieLocationHistory.length)&&(i<=3);i++) {
					var _cookieLocationHistoryRecord = cookieLocationHistory[i];
					if (_cookieLocationHistoryRecord.neighborhoodCode == _newLocation.neighborhoodCode && _cookieLocationHistoryRecord.cityCode == _newLocation.cityCode) {
						continue;
					}
					newCookieLocationHistory.push(_cookieLocationHistoryRecord);
				}
			}
			cookieLocationHistory	= newCookieLocationHistory;
			
			apriCookieBase.setCookie('locationHistory', JSON.stringify(cookieLocationHistory), 31);  //expdays
			
			if (twm.activeActionType != undefined ) twm.fase[twm.activeActionType].close();
			
			goToPage('succesPage');

		}
		return true;  	
	}

	var sendData = function(data) {
//		http://openiod.com/SCAPE604/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&inputformat=insertom&objectid=humansensor&format=xml
//			&region=EHV		&lat=50.1		&lng=4.0		&category=airquality		&value=1

		var _url = openiodUrl + '/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&inputformat=executeinsertom&objectid=humansensor&format=xml';
		_url = _url + '&region=EHV' + '&neighborhoodcode=' + data.neighborhoodCode + '&citycode=' + data.cityCode + '&observation=' + data.observation ;
		ajaxGetData(_url,
			function(data) {
			}
		);

	}

		
	
	var geoFindMe = function(page) {
	
		var map = page.geoLocationMap;
		
		page.displayElements.pageTabContentAutoTextElement.innerHTML = '';

		if (geoLocationAutomatic == undefined) {
			page.displayElements.pageTabContentAutoTextElement.innerHTML = 'Het automatisch bepalen van uw locatie is op dit apparaat niet mogelijk.';
			geoLocation.automatic	= false;
			return false;
		}
		if (geoLocationAutomatic == {}) {
			page.displayElements.pageTabContentAutoTextElement.innerHTML = 'Het automatisch bepalen van uw locatie is op dit apparaat uitgezet.<BR/>Activeer geolocatie om hiervan gebruik te kunnen maken of kies voor handmatig.';
			geoLocation.automatic	= false;
			return false;
		}
		
		if (geoLocation&&(geoLocation.lat!=geoLocationAutomatic.lat||geoLocation.lng!=geoLocationAutomatic.lng)) {
			geoLocation.lat			= geoLocationAutomatic.lat;
			geoLocation.lng			= geoLocationAutomatic.lng;
			geoLocation.automatic	= true;
			apriPages.locationPage.gotoLocation(map);
		}
	};

/*
		function error() {
//			element.innerHTML = "Unable to retrieve your location";
			//element.innerHTML = "Een poging om uw locatie te bepalen is helaas mislukt. Probeer opnieuw of (her-)start het locatie bepalen op dit apparaat.";
			page.displayElements.pageTabContentAutoTextElement.innerHTML = 'Het automatisch bepalen van uw locatie is op dit apparaat uitgezet.<BR/>Activeer geolocatie om hiervan gebruik te kunnen maken of kies voor handmatig.';
			geoLocation.automatic	= false;

//			geoLocation = {};
		};

		//output.innerHTML = "<p>Locating…</p>";
		if (geoLocation.manual != true ) {
			navigator.geolocation.getCurrentPosition(success, error);
		}		
*/
//	};
	
	
	var geoLocationAutomaticLoop	= function() {
		if (!navigator.geolocation){
			geoLocationAutomatic 	= undefined;
			return false;
		}
		if (geoLocation.manual != true ) {
			navigator.geolocation.getCurrentPosition(geoLocationAutomaticSuccess, geoLocationAutomaticError);
		}		
	}
	var geoLocationAutomaticError	= function(position) {
		geoLocationAutomatic 		= {};
	}
	var geoLocationAutomaticSuccess	= function(position) {
		geoLocationAutomatic 		= {};
		geoLocationAutomatic.lat	= Math.round(position.coords.latitude*10000)/10000;
		geoLocationAutomatic.lng	= Math.round(position.coords.longitude*10000)/10000;
	};
	

	var getNeighborhood = function(map) {
//		http://openiod.com/SCAPE604/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&inputformat=projectEhvAirport&objectid=geoLocationArea&lat=51.45401&lng=5.47668&format=xml


		var _url = openiodUrl + '/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&inputformat=projectEhvAirport&objectid=geoLocationArea&format=xml';
		_url = _url + '&region=EHV' + '&lat=' + geoLocation.lat + '&lng=' + geoLocation.lng  ;
		ajaxGetData(_url,
			function(data) {
				
				var result = JSON.parse(data);
				
				apriPages.locationPage.cbsBuurtLocationLayer.clearLayers();
				apriPages.locationPage.cbsBuurtLocationLayer.addData(result);
				
				geoLocation.cityCode			= result[0].properties.gm_code;
				geoLocation.cityName			= result[0].properties.gm_naam;
				geoLocation.neighborhoodCode	= result[0].properties.bu_code;
				geoLocation.neighborhoodName	= result[0].properties.bu_naam;
				
				//apriPages.locationPage.gm_code	= geoLocation.cityCode;
				//apriPages.locationPage.gm_naam	= geoLocation.cityName;
				//apriPages.locationPage.bu_code	= geoLocation.neighborhoodCode;
				//apriPages.locationPage.bu_naam	= geoLocation.neighborhoodName;
								
				apriPages.locationPage.displayElements.locationPageNeighborhoodContentElement.innerHTML =  geoLocation.neighborhoodName;
				apriPages.locationPage.displayElements.locationPageCityContentElement.innerHTML 		=  geoLocation.cityName;
				
				return true;
			}
		);
		
	};

	var getResults = function() {  //map, geoLocation
		
//var _url= "http://openiod.com/SCAPE604/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&inputformat=projectEhvAirport&objectid=areas&format=xml"

		var _url = openiodUrl + '/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&inputformat=projectEhvAirport&objectid=areas&format=xml';
		_url = _url + '&region=EHV' + '&lat=' + geoLocation.lat + '&lng=' + geoLocation.lng + '&neighborhood=' + "24h" ;
		ajaxGetData(_url,
			function(data) {
				
				var _page = apriPages.resultPage;
				_page.data = {};
				_page.cbsBuurtProjectEhvAirportLayer.clearLayers();
				if (data != '{}') {
					var result = JSON.parse(data);
					_page.data= result;
					_page.cbsBuurtProjectEhvAirportLayer.addData(result);
					_page.resetScore();
					_page.setStyle_cbsBuurtProjectEhvAirportLayer();
				}
				
				
			}
		);
		
	};

var createGraphicTrend = function(result, options) {
	var i,j, key, 
		inpRecord, outRecord, outRecord2,
		data=[];

	apriViewContainer.classList.remove("loading-animation");
	
	var jsonResponse = result.sort(function(a,b) {								
		//var _aDate = new Date(a.date).getTime();
		//var _bDate = new Date(b.date).getTime();
					
		if (a.hist_year < b.hist_year) return -1;
		if (a.hist_year > b.hist_year) return 1;
		if (a.hist_month < b.hist_month) return -1;
		if (a.hist_month > b.hist_month) return 1;
		if (a.hist_day < a.hist_day) return -1;
		if (a.hist_day > a.hist_day) return 1;
//		if (a.avg_type < b.avg_type) return -1;
//		if (a.avg_type > b.avg_type) return 1;
		if (a.airbox < b.airbox) return -1;
		if (a.airbox > b.airbox) return 1;
		if (a.avg_type < b.avg_type) return -1;
		if (a.avg_type > b.avg_type) return 1;
		
		return 0;
	})

	function structuredClone_replaceState(obj) {
		var oldState = history.state;
		history.replaceState(obj, null);
		var clonedObj = history.state;
		history.replaceState(oldState, null);
		return clonedObj;
	}	
	
	// postgres averages
	if (jsonResponse[0] && jsonResponse[0].hist_year ) {
		for(i=0;i<jsonResponse.length;i++) {
			var _dateAbsolute, _dateRelative;
			inpRecord = jsonResponse[i];
			outRecord = {};			
			
			outRecord = inpRecord; 

			outRecord2.date 		= new Date(outRecord2.dateRelative.getTime());
			data.push(outRecord2);
			
		}
	}

	
	if (graphicTrend==null) {
		graphicTrend = new ApriD3GraphicTrend();
		graphicTrend.createGraphic(data, options);
	} else {
		graphicTrend.updateGraphic(data, options);
	}	
	graphicTrend.render();
}


	var viewFieldUrl_parseUrl = function(e) {
		parsedUrl = parseUrl(viewFields.viewFieldUrl.value);
		viewFields.viewFieldServerProtocol.value 	= parsedUrl.serverProtocol;
		viewFields.viewFieldServer.value 			= parsedUrl.server;
		viewFields.viewFieldServerPort.value 		= parsedUrl.serverPort;
		viewFields.viewFieldUrlPath.value 			= parsedUrl.urlPath;
		viewFields.viewFieldUrlParameters.value 	= parsedUrl.urlParameters;
		viewField_check_all();
	}

//	var executeApi = function(e) {
//		//alert('test');
//		var _url = viewFields.viewFieldUrl.value;
//		apriAjaxBase.request(_url,{},{},showResult, null);		
//	};
	
	var viewFieldUrl_Check = function(e) {
		alert(viewFields.viewFieldUrl.value);
	}

	var viewFieldServerProtocol_Check = function(e) {
		var _error = false;
		if (viewFields.viewFieldServerProtocol.value == 'http' | viewFields.viewFieldServerProtocol.value == 'https' ) {
			viewFields.viewFieldServerProtocol.classList.remove("viewField-error");
			viewFields.viewFieldUrl.value = stringifyUrl();
		} else {
			_error = true;
			viewFields.viewFieldServerProtocol.classList.add("viewField-error");
		}
		//alert(viewFields.viewFieldServerProtocol.value);
	}
	var viewFieldServer_Check = function(e) {
		var _error = false;
		if (viewFields.viewFieldServer.value != '' ) {
			viewFields.viewFieldServer.classList.remove("viewField-error");
			viewFields.viewFieldUrl.value = stringifyUrl();
		} else {
			_error = true;
			viewFields.viewFieldServer.classList.add("viewField-error");
		}
	}
	var viewFieldServerPort_Check = function(e) {
		var _error = false;
		if (viewFields.viewFieldServerPort.value != '' ) {
			viewFields.viewFieldServerPort.classList.remove("viewField-error");
			viewFields.viewFieldUrl.value = stringifyUrl();
		} else {
			_error = true;
			viewFields.viewFieldServerPort.classList.add("viewField-error");
		}
	}	
	var viewFieldUrlPath_Check = function(e) {
		var _error = false;
		if (viewFields.viewFieldUrlPath.value != '' ) {
			viewFields.viewFieldUrlPath.classList.remove("viewField-error");
			viewFields.viewFieldUrl.value = stringifyUrl();
		} else {
			_error = true;
			viewFields.viewFieldUrlPath.classList.add("viewField-error");
		}
	}	
	var viewFieldUrlParameters_Check = function(e) {
		var _error = false;
		if (viewFields.viewFieldUrlParameters.value != '' ) {
			viewFields.viewFieldUrlParameters.classList.remove("viewField-error");
			var params = parseUrlParameters(viewFields.viewFieldUrlParameters.value);
			viewFields.viewFieldUrl.value = stringifyUrl();
		} else {
			_error = true;
			viewFields.viewFieldUrlParameters.classList.add("viewField-error");
		}
	}	
	
	var viewField_check_all = function() {
		viewFieldServerProtocol_Check();
		viewFieldServer_Check();
		viewFieldServerPort_Check();
		viewFieldUrlPath_Check();
		viewFieldUrlParameters_Check();
	}


	
	var showResult = function(result) {
		viewFields.viewFieldResult.value = JSON.stringify(result);
	}
	
	var parseUrl = function(url) {
		// result default values
		var result = {};
		result.serverProtocol 	= 'https';
		result.server			= 'openiod.org'; 
		result.serverPort 		= '443';
		result.urlPath 			= '';
		result.urlParameters 	= '';

		if (url == '') return result;
		var _work = url;
		
		var _index = _work.search(/(http|https):\/\//);
		if (_index == 0) {
			_index = _work.search(/:\/\//);
			result.serverProtocol = _work.substr(0, _index);
			_work = _work.substr(_index+3);
		};
		
		var _index = _work.search(/(:|\/)/);
		if (_index >=0) {
			result.server = _work.substr(0, _index);
			_work = _work.substr(_index);
		} else {
			result.server = _work;
			return result;
		};
		_index = _work.search(/\//);
		if (_index == -1) {
			result.server = _work;
			return result;
		};
		if (_index == 0 | _index == 1) {
			result.serverPort = '80';
			if (_index == 1) _work = _work.substr(1);
		} else {
			result.serverPort = _work.substr(1, _index-1);
			_work = _work.substr(_index);
		};

		_index = _work.search(/\?/);
		if (_index == -1) {
			result.urlPath = _work;
			return result;
		};
		if (_index == 0) {
			result.urlPath = '';
		} else {
			result.urlPath = _work.substr(0, _index);
			_work = _work.substr(_index);
		};
		
		result.urlParameters = _work.substr(1);
		return result;
		
	};
	
	var parseUrlParameters = function(parameters) {
		var _keyValues = {};
		var _params = parameters.split('&');
		for (var i=0;i<_params.length;i++) {
			var _keyValue 	= _params[i].split('=');
			var _key		= _keyValue[0];
			var _value 		= _keyValue[1];
			_keyValues[_key] 	= _value;
		}
		return _keyValues;
	}

	var stringifyUrl = function() {
		var _url = '';
		var _port='';
		if (viewFields.viewFieldServerPort.value == '80' & viewFields.viewFieldServerProtocol.value == 'http' ) {
			_port='';
		} else {
			_port = ':' + viewFields.viewFieldServerPort.value;
		}
		_url = _url.concat(viewFields.viewFieldServerProtocol.value,
			'://',
			viewFields.viewFieldServer.value, 
			_port,
			'',
			viewFields.viewFieldUrlPath.value,
			'?', 
			viewFields.viewFieldUrlParameters.value
		);
		return _url; 
	}
	
// View manager
// apri-view-block 
//  - apri-view-field
//  - apri-view-field-list-block
//  	- apri-view-field-list-item
//     		- apri-view-field
// 			- apri-view-list-block
//			  	- apri-view-field-list-item
//					- apri-view-field
//						- apri-view-field-label
//						- apri-view-field-message
//						- apri-view-field-content
//						- apri-view-field-inq
 	
	var viewManager = {};
	viewManager.viewBlocks={};
	viewManager.parseViewBlocks = function(domElement) {
		var _viewBlocks = domElement.getElementsByClassName('apri-view-block');
		for (var i=0;i<_viewBlocks.length;i++) {
			var _viewBlock = _viewBlocks[i];
			_viewBlock.id = APRI.UTIL.apriGuid(_viewBlock.id);
			viewManager.viewBlocks[_viewBlock.id]={};
			viewManager.viewBlocks[_viewBlock.id].domElement = _viewBlock;
			
			viewManager.parseViewBlockFields(viewManager.viewBlocks[_viewBlock.id]);
			viewManager.parseViewBlockLists(viewManager.viewBlocks[_viewBlock.id]);
		}
	}
	// get all field children within the dom-element
	viewManager.parseViewBlockFields = function(viewBlock) {
		if (viewBlock.viewBlockFields==undefined) viewBlock.viewBlockFields={};
		var _viewBlockFields = viewBlock.domElement.getElementsByClassName('apri-view-field');
		for (var i=0;i<_viewBlockFields.length;i++) {
			var _viewBlockField = _viewBlockFields[i];
			_viewBlockField.id = APRI.UTIL.apriGuid(_viewBlockField.id);
			viewBlock.viewBlockFields[_viewBlockField.id]={};
			viewBlock.viewBlockFields[_viewBlockField.id].domElement = _viewBlockField;
		}
	}
	// get all list children within the dom-element
	viewManager.parseViewBlockLists = function(viewBlock) {
		if (viewBlock.viewBlockLists==undefined) viewBlock.viewBlockLists={};
		var _viewBlockLists = viewBlock.domElement.getElementsByClassName('apri-view-list');
		for (var i=0;i<_viewBlockLists.length;i++) {
			var _viewBlockList = _viewBlockLists[i];
			_viewBlockList.id = APRI.UTIL.apriGuid(_viewBlockList.id);
			viewBlock.viewBlockLists[_viewBlockList.id]={};
			viewBlock.viewBlockLists[_viewBlockList.id].domElement = _viewBlockList;
			
			//recursive get lists and fields  
			viewManager.parseViewBlockListItems(viewBlock.viewBlockLists[_viewBlockList.id]);
			//viewManager.parseViewBlockLists(viewBlock.viewBlockLists[_viewBlockList.id]);			
		}
	}	

	// get list items within the view-list
	viewManager.parseViewBlockListItems = function(viewBlockList) {
		if (viewBlockList.viewBlockListItems==undefined) viewBlockList.viewBlockListItems={};
		var _viewBlockListItems = viewBlockList.domElement.childNodes;
		for (var i=0;i<_viewBlockListItems.length;i++) {
			var _viewBlockListItem = _viewBlockListItems[i];
			if (_viewBlockListItem.classList == undefined) continue;
			if (!_viewBlockListItem.classList.contains('apri-view-list-item') ) continue;
			
			_viewBlockListItem.id = APRI.UTIL.apriGuid(_viewBlockListItem.id);
			viewBlockList.viewBlockListItems[_viewBlockListItem.id]={};
			viewBlockList.viewBlockListItems[_viewBlockListItem.id].domElement = _viewBlockListItem;
			
			//recursive get lists fields  
			viewManager.parseViewBlockFields(viewBlockList.viewBlockListItems[_viewBlockListItem.id]);
			viewManager.parseViewBlockLists(viewBlockList.viewBlockListItems[_viewBlockListItem.id]);			
		}
	}	



	//=== Page functions =========
	var initApriPages	= function() {
		apriPages 		= {};
		var _pageName;
		
	
		//=== Page introPage functions =========
	
		_pageName = 'introPage';
		createPage(_pageName);
	
		apriPages.introPage.init 		= function (container) {
		
			var _page 				= apriPages.introPage;
			if (_page.displayElements == undefined) _page.displayElements = {};
			var _displayElements 	= _page.displayElements;
			_page.active 			= false;
			
			//			displayElements.introPage				= appBodyContainer.getElementsByClassName("intro-page")[0];
			_displayElements.pageBodyElement	= _page.container.getElementsByClassName("apri-view-body")[0];
			
			_displayElements.introPageContentElement = document.createElement('div');
			//var introPageBodyBodyTextElement 	= introPage.getElementsByClassName("apri-view-body-body-text")[0];
			_displayElements.introPageContentElement.innerHTML = introText;
			_displayElements.pageBodyElement.appendChild(_displayElements.introPageContentElement);
			
			var _innerHTML = 'Ga door';
			var _pageActionsElement 	= _page.container.getElementsByClassName("apri-page-actions")[0];
			var nextPagePage = _pageActionsElement.getAttribute('nextpage');
			if (nextPagePage) {
				var nextPageElement = document.createElement('div');
				nextPageElement.innerHTML = _innerHTML;
				nextPageElement.className	= 'page-action-button'
				nextPageElement.setAttribute('nextpage',nextPagePage);
				_pageActionsElement.appendChild(nextPageElement);
				nextPageElement.addEventListener('click', nextPage, false);
			}
			
			logLoadPerformance();
		}

		apriPages.introPage.activate 	= function () {
			var _page = apriPages.introPage;
			if (_page.container == undefined) {
				_page.container	= appBodyContainer.getElementsByClassName("introPage")[0];
				_page.init();
			}
			setPageVisible(_page);
		}
		
		apriPages.introPage.pause 		= function () {
		}
		
		apriPages.introPage.deactivate 	= function () {
			var _page = apriPages.introPage;
			setPageHidden(_page);
		}

		apriPages.introPage.close 		= function () {
		}
		
		//=== Page introPage functions End =========
		
		//=== Page locationPage functions =========
	
		_pageName = 'locationPage';
		createPage(_pageName);
		
		apriPages.locationPage.linkedPage	= {};
		apriPages.locationPage.linkedPage['surveyPage']={};
		
		apriPages.locationPage.init 		= function (container, callBack) {
			var _callback = callBack.bind(this);
			
			var _init_page = apriPages.locationPage.init_page.bind(this, container, callBack);
			var self = this;
			if (!window.L) {
				loadModule('Leaflet', _init_page
//					alert('module geladen')
//					apriPages.locationPage.init_page(container, _callBack);
//				}
);
			} else apriPages.locationPage.init_page(container, callBack);
		}	

		apriPages.locationPage.init_page 		= function (container, callBack) {

			var _page 				= apriPages.locationPage;
			if (_page.displayElements == undefined) _page.displayElements = {};
			var _displayElements 	= _page.displayElements;
			_page.active 			= false;
			
			
		
			if (RDres == undefined) {
				RDres = [3440.640, 1720.320, 860.160, 430.080, 215.040, 107.520, 53.760, 26.880, 13.440, 6.720, 3.360, 1.680, 0.840, 0.420];
				RDcrs = L.CRS.proj4js('EPSG:28992', '+proj=sterea +lat_0=52.15616055555555 +lon_0=5.38763888888889 +k=0.9999079 +x_0=155000 +y_0=463000 +ellps=bessel +units=m +towgs84=565.2369,50.0087,465.658,-0.406857330322398,0.350732676542563,-1.8703473836068,4.0812 +no_defs', new L.Transformation(1, 285401.920, -1, 903401.920));
				//RDcrs.scale = function(zoom) {
    			//	return 1 / res[zoom];
				//};	
   				RDcrs.scale = function (zoom) {
    				return 1 / RDres[zoom];
   				};
			}
						
			//			displayElements.introPage				= appBodyContainer.getElementsByClassName("intro-page")[0];
			_displayElements.pageBodyElement	= _page.container.getElementsByClassName("apri-view-body")[0];

			_displayElements.pageContentElement	= _page.container.getElementsByClassName("locationpage-text")[0];
			_displayElements.pageContentElement.innerHTML = locationText;


			_displayElements.pageLiPrevElement				= _page.container.getElementsByClassName("locationpage-li-prev")[0];
			_displayElements.pageLiPrevElement.innerHTML 	= 'Vorige locaties';
			_displayElements.pageLiPrevElement.addEventListener('click',function(e) {
					_displayElements.pageLiManualElement.classList.remove('tab-selected');
					_displayElements.pageLiAutoElement.classList.remove('tab-selected');
					_displayElements.pageLiPrevElement.classList.remove('tab-selected');
					_displayElements.pageLiPrevElement.classList.add('tab-selected');

					_displayElements.pageTabContentPrevElement.classList.remove('tab-selected');
					_displayElements.pageTabContentManualElement.classList.remove('tab-selected');
					_displayElements.pageTabContentAutoElement.classList.remove('tab-selected');
					_displayElements.pageTabContentPrevElement.classList.add('tab-selected');
				});
			_displayElements.pageLiAutoElement				= _page.container.getElementsByClassName("locationpage-li-auto")[0];
			_displayElements.pageLiAutoElement.innerHTML 	= 'Automatisch';
			_displayElements.pageLiAutoElement.addEventListener('click',function(e) {
					_displayElements.pageLiPrevElement.classList.remove('tab-selected');
					_displayElements.pageLiManualElement.classList.remove('tab-selected');
					_displayElements.pageLiAutoElement.classList.remove('tab-selected');
					_displayElements.pageLiAutoElement.classList.add('tab-selected');

					_displayElements.pageTabContentPrevElement.classList.remove('tab-selected');
					_displayElements.pageTabContentManualElement.classList.remove('tab-selected');
					_displayElements.pageTabContentAutoElement.classList.remove('tab-selected');
					_displayElements.pageTabContentAutoElement.classList.add('tab-selected');
				});
			_displayElements.pageLiManualElement			= _page.container.getElementsByClassName("locationpage-li-manual")[0];
			_displayElements.pageLiManualElement.innerHTML 	= 'Handmatig';
			_displayElements.pageLiManualElement.addEventListener('click',function(e) {
					_displayElements.pageLiPrevElement.classList.remove('tab-selected');
					_displayElements.pageLiManualElement.classList.remove('tab-selected');
					_displayElements.pageLiAutoElement.classList.remove('tab-selected');
					_displayElements.pageLiManualElement.classList.add('tab-selected');
					
					_displayElements.pageTabContentPrevElement.classList.remove('tab-selected');
					_displayElements.pageTabContentManualElement.classList.remove('tab-selected');
					_displayElements.pageTabContentAutoElement.classList.remove('tab-selected');
					_displayElements.pageTabContentManualElement.classList.add('tab-selected');
				});
			

			_displayElements.locationPageLocationDescriptionElement 	= _page.container.getElementsByClassName("locationpage-location")[0];
			_displayElements.locationPageNeighborhoodElement 			= _displayElements.locationPageLocationDescriptionElement.getElementsByClassName("location-neighborhood")[0];
			_displayElements.locationPageNeighborhoodLabelElement 		= _displayElements.locationPageNeighborhoodElement.getElementsByClassName("location-label")[0];
			_displayElements.locationPageNeighborhoodContentElement 	= _displayElements.locationPageNeighborhoodElement.getElementsByClassName("location-content")[0];
			_displayElements.locationPageNeighborhoodLabelElement.innerHTML = 'Buurt: ';

			_displayElements.locationPageCityElement 					= _displayElements.locationPageLocationDescriptionElement.getElementsByClassName("location-city")[0];
			_displayElements.locationPageCityLabelElement 				= _displayElements.locationPageCityElement.getElementsByClassName("location-label")[0];
			_displayElements.locationPageCityContentElement 			= _displayElements.locationPageCityElement.getElementsByClassName("location-content")[0];
			_displayElements.locationPageCityLabelElement.innerHTML 	= 'Gemeente: ';
			
			_displayElements.locationPageShowHide		 				= _displayElements.locationPageLocationDescriptionElement.getElementsByClassName("location-show-hide")[0];
			_displayElements.locationPageShowHide.addEventListener('click',function(e) {
				_displayElements.locationpageSubpage.classList.toggle('locationpage-subpage-hide');
				window.dispatchEvent(new Event('resize')); //force resize. Especially for leaflet maps
			});
			_displayElements.locationpageSubpage						= _page.container.getElementsByClassName("locationpage-subpage")[0];
			_displayElements.locationPageShowHide.classList.add('hide');
			_displayElements.locationpageSubpage.classList.add('locationpage-subpage-hide');
			
			
			
//			_displayElements.locationPageNeighborhoodLabelElement.innerHTML = 'Buurt: ';
//			_displayElements.locationPageCityLabelElement.innerHTML = 'Gemeente: ';			

			_displayElements.pageTabContentPrevElement				= _page.container.getElementsByClassName("locationpage-tab-content-prev")[0];
			_displayElements.pageTabContentAutoElement				= _page.container.getElementsByClassName("locationpage-tab-content-auto")[0];
			_displayElements.pageTabContentManualElement			= _page.container.getElementsByClassName("locationpage-tab-content-manual")[0];


			_displayElements.pageTabContentPrevTextElement 			= document.createElement('div');
			_displayElements.pageTabContentPrevElement.appendChild(_displayElements.pageTabContentPrevTextElement);
			if (cookieLocationHistory) {
				for (var i=0;i<cookieLocationHistory.length&&i<=3;i++) {
					var location = document.createElement('div');
					location.innerHTML = cookieLocationHistory[i].cityName + ' / ' +cookieLocationHistory[i].neighborhoodName;
//					location.setAttribute('lat',cookieLocationHistory[i].lat);
//					location.setAttribute('lng',cookieLocationHistory[i].lng);
					location.geoLocation = cookieLocationHistory[i];
					location.addEventListener('click',apriPages.locationPage.gotoHistoryLocation);
					_displayElements.pageTabContentPrevElement.appendChild(location);
				}
			}




			_displayElements.pageTabContentAutoTextElement 			= document.createElement('div');
			_displayElements.pageTabContentAutoElement.appendChild(_displayElements.pageTabContentAutoTextElement);




			_displayElements.locationPageMapElement				= _page.container.getElementsByClassName("locationpage-map")[0];
//			_displayElements.locationPageMapElement.style.height	= '17rem';
//			_displayElements.locationPageMapElement.style.width		= '17rem';

			

			/* create location map */
			_page.geoLocationMap = L.map(_displayElements.locationPageMapElement, {'attributionControl': false})
				.setView([geoLocation.lat, geoLocation.lng], appConfig.viewZoomLevel);
				
				
			_page.geoLocationMap.dragging.disable();
			_page.geoLocationMap.touchZoom.disable();
			_page.geoLocationMap.doubleClickZoom.disable();
			_page.geoLocationMap.scrollWheelZoom.disable();
			_page.geoLocationMap.boxZoom.disable();
			_page.geoLocationMap.keyboard.disable();
			if (_page.geoLocationMap.tap) _page.geoLocationMap.tap.disable();
			_displayElements.locationPageMapElement.style.cursor='default';		

			_page.geoLocationMap.on('click', function(e) {        
				_page.geoLocationMap.setView(e.latlng);
			});


/*
map.dragging.enable();
map.touchZoom.enable();
map.doubleClickZoom.enable();
map.scrollWheelZoom.enable();
map.boxZoom.enable();
map.keyboard.enable();
if (map.tap) map.tap.enable();
document.getElementById('map').style.cursor='grab';
*/
	
				
//			_page.geoLocationMap.spin(true);	
			 
			L.tileLayer.wms(siteProtocol+'www.openbasiskaart.nl/mapcache?SRS=EPSG%3A28992', {
				layers: 'osm',
				format: 'image/png',
				transparent: true,
				tiled: true,
				crs : RDcrs,
				attribution: '<a href="https://openstreetmap.org">OSM</a>',
				prefix:'false',
				maxZoom: 18
			}).addTo(_page.geoLocationMap);
			
			_page.cbsBuurtLocationLayer = new L.geoJson(null, {
				layerType:"cbsBuurtLocationLayer"
				, style: function (feature) {
					var _color = "#000000";
					var _fillOpacity = 0.5;
		//			if (feature.properties.bu_naam== 'Verspreide huizen Riethoven') 	{ 
		//				_color = "#FF0000"; 
		//				_fillOpacity = 0.4; 
		//			};
													
	        		return {color: '#000000', opacity:1, fillColor:_color, weight:2, fillOpacity:_fillOpacity };
    			}
		//		, onEachFeature:onEachCbsBuurtProjectEhvAirportFeature
				, refreshData:true
			}).addTo(_page.geoLocationMap);
			




/*			
//			var locationMap = L.map('map');
//			L.tileLayer('https://api.tiles.mapbox.com/v4/MapID/997/256/{z}/{x}/{y}.png?access_token={accessToken}', {
//    			attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
//    			maxZoom: 18
//			}).addTo(locationMap);
						
			var locationPageActionNextPageElement 	= displayElements.locationPage.getElementsByClassName("apri-page-actions")[0];
			var nextPagePage = locationPageActionNextPageElement.getAttribute('nextpage');
			if (nextPagePage) {
				var nextPageElement = document.createElement('div');
				nextPageElement.innerHTML = 'Next';
				nextPageElement.setAttribute('nextpage',nextPagePage);
				locationPageActionNextPageElement.appendChild(nextPageElement);
				nextPageElement.addEventListener('click', nextPage, false);
			}
*/




			_displayElements.pageTabContentManualElement			= _page.container.getElementsByClassName("locationpage-tab-content-manual")[0];

			_displayElements.pageTabContentManualDivElement 				= document.createElement('div');
			_displayElements.pageTabContentManualDivElement.style.height	= '30rem';
			_displayElements.pageTabContentManualDivElement.style.width		= '18rem';
			
			_displayElements.pageTabContentManualElement.appendChild(_displayElements.pageTabContentManualDivElement);



			/*

			var _innerHTML = 'Ga door naar vragenlijst';
			var _pageActionsElement 	= _page.container.getElementsByClassName("apri-page-actions")[0];
			var nextPagePage = _pageActionsElement.getAttribute('nextpage');
			if (nextPagePage) {
				var nextPageElement = document.createElement('div');
				nextPageElement.innerHTML = _innerHTML;
				nextPageElement.className	= 'page-action-button'
				nextPageElement.setAttribute('nextpage',nextPagePage);
				_pageActionsElement.appendChild(nextPageElement);
				nextPageElement.addEventListener('click', nextPage, false);
			}
			
			*/
			
			callBack();
			
			logLoadPerformance();
		}


		apriPages.locationPage.gotoHistoryLocation	= function (e) {
			var _geoLocation	= e.target.geoLocation;
			setGeoLocation(_geoLocation);
			apriPages.locationPage.gotoLocation(apriPages.locationPage.geoLocationMap);
		};


		apriPages.locationPage.gotoLocation	= function (map) {
					
			if (geoLocationMarker == undefined || geoLocationPrev.lat != geoLocation.lat || geoLocationPrev.lng != geoLocation.lng) {
				map.setView([geoLocation.lat, geoLocation.lng], appConfig.viewZoomLevel);
				if (geoLocationMarker == undefined) {
					geoLocationMarker 	= L.marker([geoLocation.lat, geoLocation.lng]).addTo(map);
					geoLocationMarker.on('dragend', function(event){
						var marker 		= event.target;
						var position 	= marker.getLatLng();
						marker.setLatLng(position).update();
						setGeoLocation({
							  lat:			position.lat
							, lng:			position.lng
							, manual:		true
							, automatic:	false
						})
						//geoLocationPrev			= geoLocation;
						getNeighborhood(map);
						return true;
					});
					geoLocationMarker.dragging.enable();
				} else {
					geoLocationMarker.setLatLng([geoLocation.lat, geoLocation.lng]);
					geoLocationMarker.update();
				}
				//geoLocationPrev	= geoLocation;
				getNeighborhood(map);
			};	

			
		}
		
		
		apriPages.locationPage.activate 	= function () {
			var _page = apriPages.locationPage;	
			if (_page.active == true) return;
							
			if (_page.container == undefined) {
				_page.container	= appBodyContainer.getElementsByClassName("locationPage")[0];
				_page.init(_page.container, function() {
					setPageVisible(_page);
			
					geoFindMe(_page);

					_page.timerGeoLocation = setInterval(function() {geoFindMe(_page); }, 1000);  // reset geolocation every 1 sec
					window.dispatchEvent(new Event('resize')); //force resize. Especially for leaflet maps
					

					for (var pageKey in _page.linkedPage) {
						apriPages[pageKey].activate();
					}
					
	
				});
			} else {
					setPageVisible(_page);
			
					geoFindMe(_page);

					_page.timerGeoLocation = setInterval(function() {geoFindMe(_page); }, 1000);  // reset geolocation every 1 sec
					window.dispatchEvent(new Event('resize')); //force resize. Especially for leaflet maps

					for (var pageKey in _page.linkedPage) {
						apriPages[pageKey].activate();
					}

			}
			
		}
		
		apriPages.locationPage.pause 		= function () {
		}
		
		apriPages.locationPage.deactivate 	= function () {
			var _page = apriPages.locationPage;
			setPageHidden(_page);

			clearInterval(_page.timerGeoLocation);

		}

		apriPages.locationPage.close 		= function () {
		}
		
		//=== Page locationPage functions End =========	
		
			
		//=== Page surveyPage functions =========
	
		_pageName = 'surveyPage';
		createPage(_pageName);
	
		apriPages.surveyPage.linkedPage	= {};
		apriPages.surveyPage.linkedPage['locationPage']={};

		apriPages.surveyPage.init 		= function (container) {
		
			var _page 				= apriPages.surveyPage;
			if (_page.displayElements == undefined) _page.displayElements = {};
			var _displayElements 	= _page.displayElements;
			_page.active 			= false;
			
			//			displayElements.introPage				= appBodyContainer.getElementsByClassName("intro-page")[0];
			_displayElements.pageBodyElement	= _page.container.getElementsByClassName("apri-view-body")[0];
			
			_displayElements.pageContentElement = document.createElement('div');
			//var introPageBodyBodyTextElement 	= introPage.getElementsByClassName("apri-view-body-body-text")[0];
			_displayElements.pageContentElement.innerHTML = surveyText;
			_displayElements.pageBodyElement.appendChild(_displayElements.pageContentElement);
			
			_displayElements.pageCategoriesContainerElement = document.createElement('div');
			_displayElements.pageCategoriesContainerElement.className = 'apri-categories';
			_displayElements.pageBodyElement.appendChild(_displayElements.pageCategoriesContainerElement);
			

			var categoryElement;
			//templates.categoryTemplate = appBodyContainer.getElementsByClassName("apri-human-sensor-template-category")[0];
			
			for (var i=0;i<categories.length;i++) {
				var categoryContainer = document.createElement('div');
				categoryContainer.className 	= 'apri-category-container category-' + categories[i].category.id ;
				categoryContainer.setAttribute('categoryid',categories[i].category.id )
				
				var categoryElementCopy = templates.categoryTemplate.cloneNode(true);
				//categoryElementCopy.classList.remove("apri-human-sensor-template-category");
				
				var categoryHeaderText = categoryElementCopy.getElementsByClassName("apri-view-header")[0];
				categoryHeaderText.innerHTML = '<H3>' + (i+1) + '. ' +categories[i].category.label + '</H3>';

				var categoryQuestionElement = document.createElement('div');
				categoryQuestionElement.className 	= 'apri-category-question';
				categoryQuestionElement.innerHTML = categories[i].category.question;					
				categoryHeaderText.appendChild(categoryQuestionElement);
				
				var categoryBodyElement = categoryElementCopy.getElementsByClassName("apri-view-body")[0];
				var answersContainerElement = document.createElement('div');
				answersContainerElement.className 	= 'apri-category-answers';
				categoryBodyElement.appendChild(answersContainerElement);
				//var answerContainerFillBefore = document.createElement('div');
				//answerContainerFillBefore.className 	= 'apri-category-answer-filler-before';
				//answersContainerElement.appendChild(answerContainerFillBefore);
				for (var j=0;j<categories[i].category.answers.length;j++) {
					var answerContainer = document.createElement('div');
					//if (categories[i].category.answers[j].id==answerEscape) {
					//	answerContainer.className 	= 'apri-category-answer apri-category-answer-' + categories[i].category.answers[j].id + ' ' + categories[i].category.answers[j].className + ' apri-category-answer-status-' + categories[i].category.answers[j].status + ' apri-category-answer-escape ' ;
					//} else {
					answerContainer.className 	= 'apri-category-answer apri-category-answer-' + categories[i].category.answers[j].id + ' ' + categories[i].category.answers[j].className + ' apri-category-answer-status-' + categories[i].category.answers[j].status;
					answerContainer.setAttribute('answerId', categories[i].category.answers[j].id );
					answerContainer.setAttribute('answerStatus', categories[i].category.answers[j].status );

					//}
					var answerIconElement = document.createElement('div');
					answerIconElement.className 	= 'apri-category-answer-icon';
					answerContainer.appendChild(answerIconElement);
					var answerLabelElement = document.createElement('div');
					answerLabelElement.className 	= 'apri-category-answer-label';
					answerLabelElement.innerHTML = categories[i].category.answers[j].label;					
					answerContainer.appendChild(answerLabelElement);
					answersContainerElement.appendChild(answerContainer);
					answerContainer.addEventListener("click", buttonPushed, false);
				}
				//var answerContainerFillAfter = document.createElement('div');
				//answersContainerElement.appendChild(answerContainerFillAfter);
				categoryContainer.appendChild(categoryElementCopy);
				_displayElements.pageCategoriesContainerElement.appendChild(categoryContainer);
			}

			_displayElements.sendButtonElement = document.createElement('div');
			_displayElements.sendButtonElement.innerHTML = 'Verstuur antwoorden';
			_displayElements.sendButtonElement.className = 'categories-send-button';
			_displayElements.sendButtonElement.addEventListener("click", sendButtonPushed, false);
			_displayElements.pageBodyElement.appendChild(_displayElements.sendButtonElement);

			var _innerHTML = 'Bekijk de resultaten';
			var _pageActionsElement 	= _page.container.getElementsByClassName("apri-page-actions")[0];
			var nextPagePage = _pageActionsElement.getAttribute('nextpage');
			if (nextPagePage) {
				var nextPageElement = document.createElement('div');
				nextPageElement.innerHTML = _innerHTML;
				nextPageElement.className	= 'page-action-button'
				nextPageElement.setAttribute('nextpage',nextPagePage);
				_pageActionsElement.appendChild(nextPageElement);
				nextPageElement.addEventListener('click', nextPage, false);
			}
		
			logLoadPerformance();	
		}
		
		apriPages.surveyPage.activate 	= function () {
			var _page = apriPages.surveyPage;
			
			if (_page.active == true) return;

			if (_page.container == undefined) {
				_page.container	= appBodyContainer.getElementsByClassName("surveyPage")[0];
				_page.init();
			}
			setPageVisible(_page);
			
			for (var pageKey in _page.linkedPage) {
				apriPages[pageKey].activate();
			}

		}
		
		apriPages.surveyPage.pause 		= function () {
		}
		
		apriPages.surveyPage.deactivate 	= function () {
			var _page = apriPages.surveyPage;
			setPageHidden(_page);		}

		apriPages.surveyPage.close 		= function () {
		}
		
		//=== Page surveyPage functions End =========
		
		
		
		//=== Page succesPage functions =========
	
		_pageName = 'succesPage';
		createPage(_pageName);
	
		apriPages.succesPage.init 		= function (container) {
		
			var _page = apriPages.succesPage;
			if (_page.displayElements == undefined) _page.displayElements = {};
			var _displayElements = _page.displayElements;
			
			//			displayElements.introPage				= appBodyContainer.getElementsByClassName("intro-page")[0];
			_displayElements.pageBodyElement	= _page.container.getElementsByClassName("apri-view-body")[0];
			
			_displayElements.pageContentElement = document.createElement('div');
			//var introPageBodyBodyTextElement 	= introPage.getElementsByClassName("apri-view-body-body-text")[0];
			_displayElements.pageContentElement.innerHTML = succesText;
			_displayElements.pageBodyElement.appendChild(_displayElements.pageContentElement);
			
			var _innerHTML = 'Bekijk de resultaten';
			var _pageActionsElement 	= _page.container.getElementsByClassName("apri-page-actions")[0];
			var nextPagePage = _pageActionsElement.getAttribute('nextpage');
			if (nextPagePage) {
				var nextPageElement = document.createElement('div');
				nextPageElement.innerHTML = _innerHTML;
				nextPageElement.className	= 'page-action-button'
				nextPageElement.setAttribute('nextpage',nextPagePage);
				_pageActionsElement.appendChild(nextPageElement);
				nextPageElement.addEventListener('click', nextPage, false);
			}

			logLoadPerformance();
		}

		apriPages.succesPage.activate 	= function () {
			var _page = apriPages.succesPage;
			if (_page.container == undefined) {
				_page.container	= appBodyContainer.getElementsByClassName("succesPage")[0];
				_page.init();
			}
			setPageVisible(_page);
		}
		
		apriPages.succesPage.pause 		= function () {
		}
		
		apriPages.succesPage.deactivate 	= function () {
			var _page = apriPages.succesPage;
			setPageHidden(_page);		}

		apriPages.succesPage.close 		= function () {
		}
		
		//=== Page succesPage functions End =========
		

		//=== Page resultPage functions =========
	
		_pageName = 'resultPage';
		createPage(_pageName);

		apriPages.resultPage.init 		= function (container, callBack) {
			var _callback = callBack.bind(this);
			
			var _init_page = apriPages.resultPage.init_page.bind(this, container, callBack);
			var self = this;
			if (!window.L) {
				loadModule('Leaflet', _init_page
//					alert('module geladen')
//					apriPages.locationPage.init_page(container, _callBack);
//				}
);
			} else apriPages.resultPage.init_page(container, callBack);
		}	
	


		apriPages.resultPage.init_page 		= function (container, callBack) {
		
			var _page 				= apriPages.resultPage;
			if (_page.displayElements == undefined) _page.displayElements = {};
			var _displayElements 	= _page.displayElements;
			_page.active 			= false;
			
//			loadModule('leaflet-spin', function(){});

			
			_page.changeCategory	= function(e) {
				resultCategory = e.target.value;
				_page.setStyle_cbsBuurtProjectEhvAirportLayer();
				
				for (var i=0; i<categories.length;i++){
					if (categories[i].category.id == resultCategory) {
						_page.displayElements.resultPageSelectQuestionElement.innerHTML	= '<div>De vraag: ' + categories[i].category.question + '</div>';
					}	
				}
			};

			_page.viewZoomLevel = 11;
			_page.mapCenterLat	= 51.45401;
			_page.mapCenterLng	= 5.47668;


			if (RDres == undefined) {
				RDres = [3440.640, 1720.320, 860.160, 430.080, 215.040, 107.520, 53.760, 26.880, 13.440, 6.720, 3.360, 1.680, 0.840, 0.420];
				RDcrs = L.CRS.proj4js('EPSG:28992', '+proj=sterea +lat_0=52.15616055555555 +lon_0=5.38763888888889 +k=0.9999079 +x_0=155000 +y_0=463000 +ellps=bessel +units=m +towgs84=565.2369,50.0087,465.658,-0.406857330322398,0.350732676542563,-1.8703473836068,4.0812 +no_defs', new L.Transformation(1, 285401.920, -1, 903401.920));
				//RDcrs.scale = function(zoom) {
    			//	return 1 / res[zoom];
				//};	
   				RDcrs.scale = function (zoom) {
    				return 1 / RDres[zoom];
   				};
			}
												
			_displayElements.pageBodyElement	= _page.container.getElementsByClassName("apri-view-body")[0];
			
			_displayElements.pageContentElement	= _displayElements.pageBodyElement.getElementsByClassName("resultpage-text")[0];
			//_displayElements.pageContentElement = document.createElement('div');
			_displayElements.pageContentElement.innerHTML = resultText;
			//_displayElements.pageBodyElement.appendChild(_displayElements.pageContentElement);


			_displayElements.pageFilterElement	= _page.container.getElementsByClassName("resultpage-filters")[0];


			_displayElements.pageContentElement = document.createElement('div');
			_displayElements.pageContentElement.innerHTML = 'Kies hier een categorie en periode<BR/> ';
			_displayElements.pageFilterElement.appendChild(_displayElements.pageContentElement);

			_displayElements.pageSelectCategoryElement = document.createElement('select');
			_displayElements.pageSelectCategoryElement.addEventListener('change', apriPages.resultPage.changeCategory, false);

			
			for (var i=0; i<categories.length;i++) {
				var _category	= categories[i].category;
				_displayElements.pageSelectCategoryOptionElement 			= document.createElement('option');
				_displayElements.pageSelectCategoryOptionElement.setAttribute('value',_category.id);
				_displayElements.pageSelectCategoryOptionElement.innerHTML 	= 'Categorie: ' + _category.label; // + ": "+_category.question;
				_displayElements.pageSelectCategoryElement.appendChild(_displayElements.pageSelectCategoryOptionElement);
			}
			
			_displayElements.pageFilterElement.appendChild(_displayElements.pageSelectCategoryElement);

			_displayElements.resultPageSelectQuestionElement 				= document.createElement('div');
			_displayElements.resultPageSelectQuestionElement.className 		= 'resultpage-question';
			_displayElements.resultPageSelectQuestionElement.innerHTML		= '<div>De vraag: ' + categories[0].category.question + '</div>';
			_displayElements.pageFilterElement.appendChild(_displayElements.resultPageSelectQuestionElement);
			
			_displayElements.pageSelectCategoryElement 						= document.createElement('select');
			_displayElements.pageSelectCategoryOptionElement 				= document.createElement('option');
			_displayElements.pageSelectCategoryOptionElement.setAttribute('value','24h');
			_displayElements.pageSelectCategoryOptionElement.innerHTML 		= 'de afgelopen 24 uur';
			_displayElements.pageSelectCategoryElement.appendChild(_displayElements.pageSelectCategoryOptionElement);
			_displayElements.pageFilterElement.appendChild(_displayElements.pageSelectCategoryElement);

			
	//		_displayElements.resultPageMapContainerElement					= _page.container.getElementsByClassName("resultpage-map-container")[0];
	//		_displayElements.resultPageMapContainerElement.addEventListener('mouseover', function(e) {
	//			e.preventDefault();
	//		})
			
			_displayElements.resultPageMapElement							= _page.container.getElementsByClassName("resultpage-map")[0];
			
//			_displayElements.pageBodyElement.appendChild(_displayElements.resultPageMapElement);

			_page.geoResultMap = L.map(_displayElements.resultPageMapElement, {'attributionControl': false})
				.setView([geoLocation.lat, geoLocation.lng], _page.viewZoomLevel);

			_page.geoResultMap.dragging.disable();
			_page.geoResultMap.touchZoom.disable();
			_page.geoResultMap.doubleClickZoom.disable();
			_page.geoResultMap.scrollWheelZoom.disable();
			_page.geoResultMap.boxZoom.disable();
			_page.geoResultMap.keyboard.disable();
			if (_page.geoResultMap.tap) _page.geoResultMap.tap.disable();
			_displayElements.resultPageMapElement.style.cursor='default';		

			_page.geoResultMap.on('click', function(e) {        
				_page.geoResultMap.setView(e.latlng);
			});	

			 
			L.tileLayer.wms(siteProtocol+'www.openbasiskaart.nl/mapcache?SRS=EPSG%3A28992', {
				layers: 'osm',
				format: 'image/png',
				transparent: true,
				tiled: true,
				crs : RDcrs,
				attribution: '<a href="https://openstreetmap.org">OSM</a>',
				prefix:'false',
				maxZoom: 18
			}).addTo(_page.geoResultMap);
			
			
			_page.setStyle_cbsBuurtProjectEhvAirportLayer	= function() {
			
				_page.cbsBuurtProjectEhvAirportLayer.eachLayer(function (layer) {  
					var feature	= layer.feature;
					
					if (resultCategory == undefined) {
						resultCategory = categories[0].category.id;
					}
					
					var observedProperty			= resultCategory; //'airquality'; 
					
					var _color = "#000000";
					var _fillOpacity = 0.2;

					//if (feature.properties.observations[observedProperty])
					var highestAnswer = '';
					var op = feature.properties.observations[observedProperty];
					for (var answer in op) {
						if (highestAnswer == '') {
							highestAnswer	= answer;
						} else {
							if (op[answer] > op[highestAnswer]) {
								highestAnswer	= answer;
							}
						}
					}

					if (highestAnswer!='') {
						_color 			= categoryColor[observedProperty][highestAnswer];
						_fillOpacity	= op[highestAnswer]/100;
					}

   	     			layer.setStyle({color: '#000000', opacity:0.5, fillColor:_color, weight:1, fillOpacity:_fillOpacity });
				})
			};
			
			_page.cbsBuurtProjectEhvAirportLayer = new L.geoJson(null, {
				layerType:"cbsBuurtProjectEhvAirportLayer"
				, onEachFeature:onEachcbsBuurtProjectEhvAirportFeature
				, pointToLayer: function (feature, latlng) {
					return L.circleMarker(latlng);
				}
				, refreshData:true
			}).addTo(_page.geoResultMap);


			_displayElements.resultPageLocationDescriptionElement 		= _page.container.getElementsByClassName("resultpage-location")[0];
			_displayElements.resultPageNeighborhoodElement 				= _displayElements.resultPageLocationDescriptionElement.getElementsByClassName("result-neighborhood")[0];
			_displayElements.resultPageNeighborhoodLabelElement 		= _displayElements.resultPageNeighborhoodElement.getElementsByClassName("result-label")[0];
			_displayElements.resultPageNeighborhoodContentElement 		= _displayElements.resultPageNeighborhoodElement.getElementsByClassName("result-content")[0];
			_displayElements.resultPageNeighborhoodLabelElement.innerHTML = 'Buurt: ';

			_displayElements.resultPageCityElement 						= _displayElements.resultPageLocationDescriptionElement.getElementsByClassName("result-city")[0];
			_displayElements.resultPageCityLabelElement 				= _displayElements.resultPageCityElement.getElementsByClassName("result-label")[0];
			_displayElements.resultPageCityContentElement 				= _displayElements.resultPageCityElement.getElementsByClassName("result-content")[0];
			_displayElements.resultPageCityLabelElement.innerHTML 		= 'Gemeente: ';
			
			
//			_displayElements.resultPageNeighborhoodLabelElement.innerHTML = 'Buurt: ';
//			_displayElements.resultPageCityLabelElement.innerHTML = 'Gemeente: ';		

//			_displayElements.pageCategoriesContainerElement 			= document.createElement('div');
//			_displayElements.pageCategoriesContainerElement.className 	= 'apri-categories';
//			_displayElements.pageBodyElement.appendChild(_displayElements.pageCategoriesContainerElement);
			
			_displayElements.pageCategoriesContainerElement				= _page.container.getElementsByClassName("resultpage-categories")[0];
			

			var categoryElement;
			//var categoryTemplate = appBodyContainer.getElementsByClassName("apri-human-sensor-template-category")[0];
			
			for (var i=0;i<categories.length;i++) {
				var categoryContainer = document.createElement('div');
				categoryContainer.className 	= 'apri-category-container category-' + categories[i].category.id ;
				categoryContainer.setAttribute('categoryid',categories[i].category.id )
				
				var categoryElementCopy = templates.categoryTemplate.cloneNode(true);
				//categoryElementCopy.classList.remove("apri-human-sensor-template-category");			
				
				var categoryHeaderText = categoryElementCopy.getElementsByClassName("apri-view-header")[0];
				categoryHeaderText.innerHTML = '<H3>' + (i+1) + '. ' +categories[i].category.label + '</H3>';

				var categoryQuestionElement = document.createElement('div');
				categoryQuestionElement.className 	= 'apri-category-question';
				categoryQuestionElement.innerHTML = categories[i].category.question;					
				categoryHeaderText.appendChild(categoryQuestionElement);
				
				var categoryBodyElement = categoryElementCopy.getElementsByClassName("apri-view-body")[0];
				var answersContainerElement = document.createElement('div');
				answersContainerElement.className 	= 'apri-category-answers';
				categoryBodyElement.appendChild(answersContainerElement);

				for (var j=0;j<categories[i].category.answers.length;j++) {
					var answerContainer = document.createElement('div');
					answerContainer.className 	= 'apri-category-answer apri-category-answer-' + categories[i].category.answers[j].id + ' ' + categories[i].category.answers[j].className + ' apri-category-answer-status-' + categories[i].category.answers[j].status;
					answerContainer.setAttribute('answerId', categories[i].category.answers[j].id );
					answerContainer.setAttribute('answerStatus', categories[i].category.answers[j].status );

					var answerIconElement = document.createElement('div');
					answerIconElement.className 	= 'apri-category-answer-icon';
					answerContainer.appendChild(answerIconElement);
					var answerScoreElement = document.createElement('div');
					answerScoreElement.className 	= 'apri-category-answer-score';
					answerContainer.appendChild(answerScoreElement);
					var answerLabelElement = document.createElement('div');
					answerLabelElement.className 	= 'apri-category-answer-label';
					answerLabelElement.innerHTML = categories[i].category.answers[j].label;					
					answerContainer.appendChild(answerLabelElement);
					answersContainerElement.appendChild(answerContainer);
					//answerContainer.addEventListener("click", buttonPushed, false);
				}
				categoryContainer.appendChild(categoryElementCopy);
				_displayElements.pageCategoriesContainerElement.appendChild(categoryContainer);
			}




			
			var _innerHTML = 'Vernieuw data';
			var _pageActionsElement 	= _page.container.getElementsByClassName("apri-page-actions")[0];
			var nextPagePage = _pageActionsElement.getAttribute('nextpage');
			if (nextPagePage) {
				var nextPageElement = document.createElement('div');
				nextPageElement.innerHTML = _innerHTML;
				nextPageElement.className	= 'page-action-button'
				nextPageElement.setAttribute('nextpage',nextPagePage);
				_pageActionsElement.appendChild(nextPageElement);
				nextPageElement.addEventListener('click', nextPage, false);
			}
			
			callBack();

			logLoadPerformance();


		}
		
		var onEachcbsBuurtProjectEhvAirportFeature	= function(feature,layer) {
			//makeShape(e.target.ownerDocument);
				//layer.bindPopup(feature.properties.gm_naam +'/'+ feature.properties.bu_naam, {closeButton: false, offset: L.point(0, -40)});
				//layer.on('mouseover', function() { layer.openPopup(); });
				//layer.on('mouseout', function() { apriPages.resultPage.geoResultMap.closePopup(); });
				layer.on('click', function(e) {	
					apriPages.resultPage.resetScore(e.target.feature.properties); 
				});
				
/*								
					var layerPopup;
layer.on('mouseover', function(e){
    //var coordinates = e.target.feature.geometry.coordinates;
    //var swapped_coordinates = coordinates; //[coordinates[1], coordinates[0]];  //Swap Lat and Lng
    if (apriPages.resultPage.geoResultMap) {
       layerPopup = L.popup()
      //     .setLatLng(swapped_coordinates)
           .setContent('Popup for feature #'+e.target.feature.properties.id)
            .openOn(apriPages.resultPage.geoResultMap);
    }
});
layer.on('mouseout', function (e) {
    if (layerPopup && apriPages.resultPage.geoResultMap) {
        apriPages.resultPage.geoResultMap.closePopup(layerPopup);
        layerPopup = null;
    }
});
*/
		}
		
		
		
		var svgns = "http://www.w3.org/2000/svg";

		function makeShape(container) {
			if ( window.svgDocument == null )
				svgDocument = container; //evt.target.ownerDocument;

			var shape = svgDocument.createElementNS(svgns, "rect");
			shape.setAttributeNS(null, "x", 5);
			shape.setAttributeNS(null, "y", 5);
			shape.setAttributeNS(null, "rx", 5);
			shape.setAttributeNS(null, "ry", 5);
			shape.setAttributeNS(null, "width",  40);
			shape.setAttributeNS(null, "height", 40);
			shape.setAttributeNS(null, "fill", "green");
    
			svgDocument.documentElement.appendChild(shape);
		}

		apriPages.resultPage.resetScore 	= function (properties) {
			var _page 				= apriPages.resultPage;
			var _displayElements	= _page.displayElements;
			
			var _neighborhoodCode;
			if (properties) {
				_neighborhoodCode												= properties.bu_code
				_displayElements.resultPageNeighborhoodContentElement.innerHTML	= properties.bu_naam;
				_displayElements.resultPageCityContentElement.innerHTML			= properties.gm_naam;
			} else {
				_neighborhoodCode												= geoLocation.neighborhoodCode;
				_displayElements.resultPageNeighborhoodContentElement.innerHTML	= geoLocation.neighborhoodName;
				_displayElements.resultPageCityContentElement.innerHTML			= geoLocation.cityName;
			}
			
			var dataProperties	= {};
			if (_neighborhoodCode) {
				for (var i=0;i<_page.data.length;i++) {
					if (_page.data[i].properties.bu_code == _neighborhoodCode) {
						dataProperties	= _page.data[i].properties;
					}
				}
			}
			
			var apriCategories	= _page.displayElements.pageCategoriesContainerElement.getElementsByClassName('apri-category-container');
			for (var i=0;i<apriCategories.length;i++) {
			
				var tmpCategory = {};

				var _category 	= apriCategories[i];
				tmpCategory.id	= _category.getAttribute('categoryid');
			
				var _answers 	= _category.getElementsByClassName('apri-category-answer');
				for (var j=0;j<_answers.length;j++) {
					var _answer = _answers[j];
					
					var _answerId	= _answer.getAttribute('answerid');
					var percentage	= '???';
					if (dataProperties.observations && dataProperties.observations[tmpCategory.id]) {
						percentage = dataProperties.observations[tmpCategory.id][_answerId];
						if (percentage==undefined) percentage	= '0'
					}
					var answerScore	= _answer.getElementsByClassName('apri-category-answer-score')[0];
					answerScore.innerHTML	= ''+percentage+'%';
					
					if (_answer.getAttribute('answerstatus')==answerStatusOn && _answer.getAttribute('answerid')!=answerEscape) {
						tmpCategory.observation	= _answer.getAttribute('answerid');
						data.categories.push(tmpCategory);
						if (data.observation != '') data.observation = data.observation + ',';
						data.observation = data.observation + tmpCategory.id + ':' + tmpCategory.observation;
						responseAvailable		= true;
					}			
				}
			
			}
/*
		if (responseAvailable) {
			sendData(data); 

			var _newLocation 				= {};
			_newLocation.cityCode			= geoLocation.cityCode;
			_newLocation.cityName			= geoLocation.cityName;
			_newLocation.neighborhoodCode	= geoLocation.neighborhoodCode;
			_newLocation.neighborhoodName	= geoLocation.neighborhoodName;
			_newLocation.lat				= geoLocation.lat;
			_newLocation.lng				= geoLocation.lng;
			
			var newCookieLocationHistory	= [];
			newCookieLocationHistory.push(_newLocation);
			
			if (cookieLocationHistory) {
				for (var i=0;(i<cookieLocationHistory.length)&&(i<=3);i++) {
					var _cookieLocationHistoryRecord = cookieLocationHistory[i];
					if (_cookieLocationHistoryRecord.neighborhoodCode == _newLocation.neighborhoodCode && _cookieLocationHistoryRecord.cityCode == _newLocation.cityCode) {
						continue;
					}
					newCookieLocationHistory.push(_cookieLocationHistoryRecord);
				}
			}
			cookieLocationHistory	= newCookieLocationHistory;
			apriCookieBase.setCookie('locationHistory', JSON.stringify(cookieLocationHistory), 31);  //expdays

		}			
*/			
			
		}

		apriPages.resultPage.activate 	= function () {
			var _page = apriPages.resultPage;
			if (_page.container == undefined) {
				_page.container	= appBodyContainer.getElementsByClassName("resultPage")[0];
				_page.init(_page.container, function() {
					setPageVisible(_page);
					getResults();
					window.dispatchEvent(new Event('resize')); //force resize. Especially for leaflet maps
			});
			} else {
				setPageVisible(_page);
				getResults();
				window.dispatchEvent(new Event('resize')); //force resize. Especially for leaflet maps
			}

		
		}
		
		apriPages.resultPage.pause 		= function () {
		}
		
		apriPages.resultPage.deactivate = function () {
			var _page = apriPages.resultPage;
			setPageHidden(_page);		}

		apriPages.resultPage.close 		= function () {
		}
		
		//=== Page resultPage functions End =========
		

		//=== Page aboutPage functions =========
		_pageName = 'aboutPage';
		createPage(_pageName);
			
		apriPages.aboutPage.init 		= function (container) {
		
			var _page 				= apriPages.aboutPage;
			if (_page.displayElements == undefined) _page.displayElements = {};
			var _displayElements 	= _page.displayElements;
			_page.active 			= false;
			
			//			displayElements.introPage				= appBodyContainer.getElementsByClassName("intro-page")[0];
			_displayElements.pageBodyElement	= _page.container.getElementsByClassName("apri-view-body")[0];
			
			_displayElements.pageContentElement = document.createElement('div');
			//var introPageBodyBodyTextElement 	= introPage.getElementsByClassName("apri-view-body-body-text")[0];
			_displayElements.pageBodyElement.appendChild(_displayElements.pageContentElement);
			
			var _innerHTML = 'Terug naar de startpagina';
			var _pageActionsElement 	= _page.container.getElementsByClassName("apri-page-actions")[0];
			var nextPagePage = _pageActionsElement.getAttribute('nextpage');
			if (nextPagePage) {
				var nextPageElement = document.createElement('div');
				nextPageElement.innerHTML = _innerHTML;
				nextPageElement.className	= 'page-action-button'
				nextPageElement.setAttribute('nextpage',nextPagePage);
				_pageActionsElement.appendChild(nextPageElement);
				nextPageElement.addEventListener('click', nextPage, false);
			}
			
			/* content */
			
			var textElement = document.createElement('div');
			textElement.innerHTML = aboutText;
			_displayElements.pageContentElement.appendChild(textElement);

			logLoadPerformance();
			
		}

		apriPages.aboutPage.activate 	= function () {
			var _page = apriPages.aboutPage;
			if (_page.container == undefined) {
				_page.container	= appBodyContainer.getElementsByClassName("aboutPage")[0];
				_page.init();
			}
			setPageVisible(_page);
		}
		
		apriPages.aboutPage.pause 		= function () {
		}
		
		apriPages.aboutPage.deactivate 	= function () {
			var _page = apriPages.aboutPage;
			setPageHidden(_page);
		}

		apriPages.aboutPage.close 		= function () {
		}
		
		//=== Page aboutPage functions End =========
		

	};
	//=== Page functions End =========
	
	var createPage	= function(pageName) {
		apriPages[pageName]	= {};
		apriPages[pageName].pageName = pageName;
	}
	var setPageVisible = function (page) {
		page.container.classList.remove('apri-page-on');
		page.container.classList.remove('apri-page-off');
		page.container.classList.add('apri-page-on');
		page.active = true;
		deepLink.parameters.pageName	= page.pageName;
		if (popState == true) {
			popState = false;
		} else {
			setDeepLinkQuery();
		};
	}
	var setPageHidden = function (page) {
		page.container.classList.remove('apri-page-on');
		page.container.classList.remove('apri-page-off');
		page.container.classList.add('apri-page-off');
		page.active = false;
	}


var twmInit	= function() {

	// Time Window Manager
	twm			= {};
	twm.fase	= {};
	twm.faseStatus	= {};		// time window status eg. project Human Sensor

	twm.fase.A001		= {};
	twm.fase.A001.notifications	= {};
	twm.fase.A001.begin	= function(m) {
		var _notificationType, _notificationTime;
		var _fase			= twm.fase.A001;
		var _notifications	= _fase.notifications;
		
		var currTime 	= new Date().getTime();
		var timeToGo	= m.endTime - currTime;
		timeToGo		= timeToGo>0?timeToGo:0;
		console.log('timeToGo: '+ timeToGo);
		setTimeout(function() {
			twm.fase.A001.close();
		},timeToGo);
		
		// m."actionStatus":"gold"
		
		_notificationType	= m.notificationType?m.notificationType:'twm';
		_notificationTime	= m.notificationTime?m.notificationTime:timeToGo;
		_notifications.notification	= addNotification({text:m.text, type:_notificationType, time: _notificationTime});
		
/*
		if (_notifications.notification) {
			var innerHTMLText = '';
			_notifications.notification.classList.add('notification-enabled');
			innerHTMLText += m.text;
			if (geoLocation.automatic == false) {
				var error = '<BR/>Uw locatie en de buurt is nog niet automatisch vastgesteld met behulp van geolocatie.<BR/>Zet dit aan om mee te kunnen doen aan de vragenlijst. ';
				innerHTMLText += error;
				_notifications.notification.classList.add('notification-error');
				playSound(); // beep
			}
			_notifications.notification.innerHTML	= innerHTMLText;
		}	
*/
		//twm.twmProgressBarInit(timeToGo);
		//goToPage('locationPage');

	}
	twm.fase.A001.close	= function() {
		var _notificationType, _notificationTime;
		var _fase			= twm.fase.A001;
		var _notifications	= _fase.notifications;

		twm.twmProgressBarclose();

		if (twm.activeFaseId=='A001A'||twm.activeFaseId=='A001B') {
			twm.activeFaseId	= undefined;
			if (_notifications.notification) {
				_notifications.notification.classList.remove('notification-enabled');
				_notifications.notification.classList.remove('notification-error');
				_notifications.notification.classList.add('notification-close');
				_notifications.notification.addEventListener('animationend',animationEndListener,false);
			}
			//displayElements.twmProgressBar.parentElement.classList.remove('enabled');
		}	
	};

	twm.fase.A002		= {};
	twm.fase.A002.notifications	= {};
	twm.fase.A002.begin	= function(m) {
		var _notificationType, _notificationTime;
		var _fase			= twm.fase.A002;
		var _notifications	= _fase.notifications;
		_fase.actionStatus	= m.actionStatus;	

		var currTime 	= new Date().getTime();
		var timeToGo	= m.endTime - currTime;
		timeToGo		= timeToGo>0?timeToGo:0;
		console.log('timeToGo: '+ timeToGo);
		setTimeout(function() {
			twm.fase.A002.close();
		},timeToGo);
		
		_notificationType	= m.notificationType?m.notificationType:'twm';
		_notificationTime	= m.notificationTime?m.notificationTime:timeToGo;
		_notifications.notification	= addNotification({text:m.text, type:_notificationType, time: _notificationTime});

/*
		if (_notifications.notification) {
			_notifications.notification.classList.add('notification-enabled');
			_notifications.notification.innerHTML	= m.text;
		}	
*/
		twm.twmProgressBarInit(timeToGo);
		//goToPage('introPage');
	}
	twm.fase.A002.close	= function() {
		var _fase			= twm.fase.A002;
		var _notifications	= _fase.notifications;
		_fase.actionStatus	= undefined;  // clear actionStatus

		twm.twmProgressBarclose();

		if (twm.activeFaseId=='A002A'||twm.activeFaseId=='A002B') {
			twm.activeFaseId	= undefined;
			if (_notifications.notification) {
				_notifications.notification.classList.remove('notification-enabled');
				_notifications.notification.classList.remove('notification-error');
				_notifications.notification.classList.add('notification-close');
				_notifications.notification.addEventListener('animationend',animationEndListener,false);
			}
		}	
	};

	twm.fase.A003		= {};
	twm.fase.A003.notifications	= {};
	twm.fase.A003.begin	= function(m) {
		var _notificationType, _notificationTime;
		var _fase			= twm.fase.A003;
		var _notifications	= _fase.notifications;

		var currTime 	= new Date().getTime();
		var timeToGo	= m.endTime - currTime;
		timeToGo		= timeToGo>0?timeToGo:0;
		setTimeout(function() {
			twm.fase.A003.close();
		},timeToGo);
		
		_notificationType	= m.notificationType?m.notificationType:'twm';
		_notificationTime	= m.notificationTime?m.notificationTime:timeToGo;
		_notifications.notification	= addNotification({text:m.text, type:_notificationType, time: _notificationTime});
		
		console.log('timeToGo: '+ timeToGo);
/*
		if (_notifications.notification) {
			_notifications.notification.classList.add('notification-enabled');
			_notifications.notification.innerHTML	= m.text;
		}
*/
		//twm.twmProgressBarInit(timeToGo);
		//goToPage('surveyPage');
	}
	twm.fase.A003.close	= function() {
		var _fase			= twm.fase.A003;
		var _notifications	= _fase.notifications;
		
		twm.twmProgressBarclose();

		if (twm.activeFaseId=='A003A'||twm.activeFaseId=='A003B') {
			twm.activeFaseId	= undefined;
			if (_notifications.notification) {
				_notifications.notification.classList.remove('notification-enabled');
				_notifications.notification.classList.remove('notification-error');
				_notifications.notification.classList.add('notification-close');
				_notifications.notification.addEventListener('animationend',animationEndListener,false);
			}
		}	
	};
		
	twm.twmProgressBarInit	= function(timeToGo) {
		twmPrograssBarTotalTime = timeToGo;
		twmPrograssBarTimeProcessed = 0;
		displayElements.twmProgressBar.parentElement.classList.add('enabled');
		twm.twmProgressBarIncrease(); // first time before delays with setInterval
		twmProgressBarIntervalId	= setInterval(twm.twmProgressBarIncrease, 4000);

	}
	twm.twmProgressBarIncrease	= function() {
		var twmProgressBarPerc;
		twmPrograssBarTimeProcessed += 4000;
		twmProgressBarPerc 			= Math.round( (twmPrograssBarTimeProcessed/twmPrograssBarTotalTime)*100);
		//console.log(twmPrograssBarTimeProcessed + ' / ' + twmPrograssBarTotalTime + ' *100 = ' +twmProgressBarPerc);
		twmProgressBarPerc			= twmProgressBarPerc>100?100:twmProgressBarPerc;
		displayElements.twmProgressBar.style.width = twmProgressBarPerc+'%';
		if (twmProgressBarPerc==100) twm.twmProgressBarclose();
	}

	twm.twmProgressBarclose	= function() {
		clearInterval(twmProgressBarIntervalId);
		displayElements.twmProgressBar.parentElement.classList.remove('enabled');
	}

}

	var animationEndListener = function(e) {
	
		if (e.animationName == 'fadeOut' && e.target == e.srcElement) {
			//notification.classList.add('notification-hide'); 
			e.srcElement.removeEventListener('animationend', animationEndListener);
			//displayElements.notifications.removeChild(notification);
			e.srcElement.parentElement.removeChild(this);
		};	
	}
	var clickListener = function(e) {
		this.classList.add('notification-close');
		this.addEventListener('animationend',animationEndListener,false);
	}

	var addNotification = function(notifier) {
		var _notificationTime;
		var notification 	= templates.notificationTemplate.cloneNode(true);
		var body			= notification.getElementsByClassName("apri-view-body")[0]
		var footer			= notification.getElementsByClassName("apri-view-footer")[0]
		var _type			= notifier.type?notifier.type:'info';
		var _icon			= notifier.icon?notifier.icon:'';
		notification.classList.add('notification-'+_type);
		notification.classList.add('notification-enabled');
		
		if (_icon == ''){
			body.innerHTML 		= notifier.text;
		} else {
			body.innerHTML 		= '<img class="notification-icon" src="'+_icon+'"></img>'+notifier.text;
		}
		
		_notificationTime	= notifier.time?notifier.time:4000;
		
		notification.addEventListener('click',clickListener,false);
		
	//	notification.addEventListener('animationend',function() {
	//		notification.classList.add('notification-hide'); 
	//	},false);
		displayElements.notifications.appendChild(notification);
		
		//if (_type=='info') {
			notification.timeOut	= setTimeout(function(notification) {
				notification.classList.add('notification-close');
				notification.addEventListener('animationend',animationEndListener,false);
			},_notificationTime,notification);
		//}
		return notification;
	}



var setHiddenProperty	= function() {

	// Set the name of the hidden property and the change event for visibility
	if (typeof document.hidden !== "undefined") { // Opera 12.10 and Firefox 18 and later support 
		hidden = "hidden";
		visibilityChange = "visibilitychange";
	} else if (typeof document.mozHidden !== "undefined") {
		hidden = "mozHidden";
		visibilityChange = "mozvisibilitychange";
	} else if (typeof document.msHidden !== "undefined") {
		hidden = "msHidden";
		visibilityChange = "msvisibilitychange";
	} else if (typeof document.webkitHidden !== "undefined") {
		hidden = "webkitHidden";
		visibilityChange = "webkitvisibilitychange";
	}
	// Warn if the browser doesn't support addEventListener or the Page Visibility API
	if (typeof document.addEventListener === "undefined" || 
		typeof document[hidden] === "undefined") {
		//alert("This demo requires a browser, such as Google Chrome or Firefox, that supports the Page Visibility API.");
	} else {
		// Handle page visibility change   
		document.addEventListener(visibilityChange, handleVisibilityChange, false);
    
		// Revert to the existing favicon for the site when the page is closed;
		// otherwise the favicon remains paused.png
		if (window.favicon!=undefined) {  // not for IE
			window.addEventListener("unload", function(){
				window.favicon.change("/favicon.ico");
			}, false);
		}	
    
//		// When the video pauses, set the favicon.
//		// This shows the paused.png image
//		videoElement.addEventListener("pause", function(){
//			favicon.change("images/paused.png");
//		}, false);

//		// When the video plays, set the favicon.
//		videoElement.addEventListener("play", function(){
//			favicon.change("images/playing.png");
//		}, false);
    
//		// set the document (tab) title from the current video time
//		videoElement.addEventListener("timeupdate", function(){
//			document.title = Math.floor(videoElement.currentTime) + " second(s)";
//		}, false);
	}
}
 
var handleVisibilityChange	= function() {
	if (document[hidden]) {
		//videoElement.pause();
		console.log('page set to hidden at '+ new Date() );
	} else {
		//videoElement.play();
		console.log('page unset hidden at '+ new Date() );
	}
}






















var playSound = (function beep() {
    var snd = new Audio("data:audio/wav;base64,//uQRAAAAWMSLwUIYAAsYkXgoQwAEaYLWfkWgAI0wWs/ItAAAGDgYtAgAyN+QWaAAihwMWm4G8QQRDiMcCBcH3Cc+CDv/7xA4Tvh9Rz/y8QADBwMWgQAZG/ILNAARQ4GLTcDeIIIhxGOBAuD7hOfBB3/94gcJ3w+o5/5eIAIAAAVwWgQAVQ2ORaIQwEMAJiDg95G4nQL7mQVWI6GwRcfsZAcsKkJvxgxEjzFUgfHoSQ9Qq7KNwqHwuB13MA4a1q/DmBrHgPcmjiGoh//EwC5nGPEmS4RcfkVKOhJf+WOgoxJclFz3kgn//dBA+ya1GhurNn8zb//9NNutNuhz31f////9vt///z+IdAEAAAK4LQIAKobHItEIYCGAExBwe8jcToF9zIKrEdDYIuP2MgOWFSE34wYiR5iqQPj0JIeoVdlG4VD4XA67mAcNa1fhzA1jwHuTRxDUQ//iYBczjHiTJcIuPyKlHQkv/LHQUYkuSi57yQT//uggfZNajQ3Vmz+Zt//+mm3Wm3Q576v////+32///5/EOgAAADVghQAAAAA//uQZAUAB1WI0PZugAAAAAoQwAAAEk3nRd2qAAAAACiDgAAAAAAABCqEEQRLCgwpBGMlJkIz8jKhGvj4k6jzRnqasNKIeoh5gI7BJaC1A1AoNBjJgbyApVS4IDlZgDU5WUAxEKDNmmALHzZp0Fkz1FMTmGFl1FMEyodIavcCAUHDWrKAIA4aa2oCgILEBupZgHvAhEBcZ6joQBxS76AgccrFlczBvKLC0QI2cBoCFvfTDAo7eoOQInqDPBtvrDEZBNYN5xwNwxQRfw8ZQ5wQVLvO8OYU+mHvFLlDh05Mdg7BT6YrRPpCBznMB2r//xKJjyyOh+cImr2/4doscwD6neZjuZR4AgAABYAAAABy1xcdQtxYBYYZdifkUDgzzXaXn98Z0oi9ILU5mBjFANmRwlVJ3/6jYDAmxaiDG3/6xjQQCCKkRb/6kg/wW+kSJ5//rLobkLSiKmqP/0ikJuDaSaSf/6JiLYLEYnW/+kXg1WRVJL/9EmQ1YZIsv/6Qzwy5qk7/+tEU0nkls3/zIUMPKNX/6yZLf+kFgAfgGyLFAUwY//uQZAUABcd5UiNPVXAAAApAAAAAE0VZQKw9ISAAACgAAAAAVQIygIElVrFkBS+Jhi+EAuu+lKAkYUEIsmEAEoMeDmCETMvfSHTGkF5RWH7kz/ESHWPAq/kcCRhqBtMdokPdM7vil7RG98A2sc7zO6ZvTdM7pmOUAZTnJW+NXxqmd41dqJ6mLTXxrPpnV8avaIf5SvL7pndPvPpndJR9Kuu8fePvuiuhorgWjp7Mf/PRjxcFCPDkW31srioCExivv9lcwKEaHsf/7ow2Fl1T/9RkXgEhYElAoCLFtMArxwivDJJ+bR1HTKJdlEoTELCIqgEwVGSQ+hIm0NbK8WXcTEI0UPoa2NbG4y2K00JEWbZavJXkYaqo9CRHS55FcZTjKEk3NKoCYUnSQ0rWxrZbFKbKIhOKPZe1cJKzZSaQrIyULHDZmV5K4xySsDRKWOruanGtjLJXFEmwaIbDLX0hIPBUQPVFVkQkDoUNfSoDgQGKPekoxeGzA4DUvnn4bxzcZrtJyipKfPNy5w+9lnXwgqsiyHNeSVpemw4bWb9psYeq//uQZBoABQt4yMVxYAIAAAkQoAAAHvYpL5m6AAgAACXDAAAAD59jblTirQe9upFsmZbpMudy7Lz1X1DYsxOOSWpfPqNX2WqktK0DMvuGwlbNj44TleLPQ+Gsfb+GOWOKJoIrWb3cIMeeON6lz2umTqMXV8Mj30yWPpjoSa9ujK8SyeJP5y5mOW1D6hvLepeveEAEDo0mgCRClOEgANv3B9a6fikgUSu/DmAMATrGx7nng5p5iimPNZsfQLYB2sDLIkzRKZOHGAaUyDcpFBSLG9MCQALgAIgQs2YunOszLSAyQYPVC2YdGGeHD2dTdJk1pAHGAWDjnkcLKFymS3RQZTInzySoBwMG0QueC3gMsCEYxUqlrcxK6k1LQQcsmyYeQPdC2YfuGPASCBkcVMQQqpVJshui1tkXQJQV0OXGAZMXSOEEBRirXbVRQW7ugq7IM7rPWSZyDlM3IuNEkxzCOJ0ny2ThNkyRai1b6ev//3dzNGzNb//4uAvHT5sURcZCFcuKLhOFs8mLAAEAt4UWAAIABAAAAAB4qbHo0tIjVkUU//uQZAwABfSFz3ZqQAAAAAngwAAAE1HjMp2qAAAAACZDgAAAD5UkTE1UgZEUExqYynN1qZvqIOREEFmBcJQkwdxiFtw0qEOkGYfRDifBui9MQg4QAHAqWtAWHoCxu1Yf4VfWLPIM2mHDFsbQEVGwyqQoQcwnfHeIkNt9YnkiaS1oizycqJrx4KOQjahZxWbcZgztj2c49nKmkId44S71j0c8eV9yDK6uPRzx5X18eDvjvQ6yKo9ZSS6l//8elePK/Lf//IInrOF/FvDoADYAGBMGb7FtErm5MXMlmPAJQVgWta7Zx2go+8xJ0UiCb8LHHdftWyLJE0QIAIsI+UbXu67dZMjmgDGCGl1H+vpF4NSDckSIkk7Vd+sxEhBQMRU8j/12UIRhzSaUdQ+rQU5kGeFxm+hb1oh6pWWmv3uvmReDl0UnvtapVaIzo1jZbf/pD6ElLqSX+rUmOQNpJFa/r+sa4e/pBlAABoAAAAA3CUgShLdGIxsY7AUABPRrgCABdDuQ5GC7DqPQCgbbJUAoRSUj+NIEig0YfyWUho1VBBBA//uQZB4ABZx5zfMakeAAAAmwAAAAF5F3P0w9GtAAACfAAAAAwLhMDmAYWMgVEG1U0FIGCBgXBXAtfMH10000EEEEEECUBYln03TTTdNBDZopopYvrTTdNa325mImNg3TTPV9q3pmY0xoO6bv3r00y+IDGid/9aaaZTGMuj9mpu9Mpio1dXrr5HERTZSmqU36A3CumzN/9Robv/Xx4v9ijkSRSNLQhAWumap82WRSBUqXStV/YcS+XVLnSS+WLDroqArFkMEsAS+eWmrUzrO0oEmE40RlMZ5+ODIkAyKAGUwZ3mVKmcamcJnMW26MRPgUw6j+LkhyHGVGYjSUUKNpuJUQoOIAyDvEyG8S5yfK6dhZc0Tx1KI/gviKL6qvvFs1+bWtaz58uUNnryq6kt5RzOCkPWlVqVX2a/EEBUdU1KrXLf40GoiiFXK///qpoiDXrOgqDR38JB0bw7SoL+ZB9o1RCkQjQ2CBYZKd/+VJxZRRZlqSkKiws0WFxUyCwsKiMy7hUVFhIaCrNQsKkTIsLivwKKigsj8XYlwt/WKi2N4d//uQRCSAAjURNIHpMZBGYiaQPSYyAAABLAAAAAAAACWAAAAApUF/Mg+0aohSIRobBAsMlO//Kk4soosy1JSFRYWaLC4qZBYWFRGZdwqKiwkNBVmoWFSJkWFxX4FFRQWR+LsS4W/rFRb/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////VEFHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAU291bmRib3kuZGUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMjAwNGh0dHA6Ly93d3cuc291bmRib3kuZGUAAAAAAAAAACU=");  
    return function() {     
        snd.play(); 
    }
})();





});
// ApriApp Class end ===============================================================================


