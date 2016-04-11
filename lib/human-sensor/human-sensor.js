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
        //...
    };

	var apriCookieBase;
	
	var apriForms;
	
	var appConfig = {};
	var secureSite;
	var siteProtocol, siteUrl, openiodUrl;
	var sitePrefixExtern;
	
	var apriConfig, apriClientInfo;
	var appBodyContainer, apriViewContainer;
	
	var locationMap, locationMapLayers, apriLeafLetBase;

	var templates;
	var refreshButton;
	
	var apriPages;
	
	var viewBlocks;
	
	var viewFields;
	var apriAjaxBase;
	
	var aireasAvgType; // 'UFP', 'PM1', 'PM25', 'PM10', 'SPMI', 'OZON', 'NO2', 'CELC', 'HUM', 'AMBHUM', 'AMBTEMP'
	
	var graphicTrend;
	var graphOptions;
	
	var parsedUrl;
	var geoLocation;
	
	var categories;
	var introText,locationText,surveyText,succesText,resultText;	
	
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

		var apriHeaderHeight = displayElements.apriMenuFixedElement.offsetHeight;
		
		var appFooterTop = window.innerHeight-displayElements.apriMenuFooterFixedElement.offsetHeight;
		displayElements.apriMenuFooterFixedElement.style.top = (appFooterTop) + 'px';
		
		displayElements.apriPagesFixedElement.style.top = (apriHeaderHeight) + 'px';
		displayElements.apriPagesFixedElement.style.height = (appFooterTop - apriHeaderHeight) + 'px';

		for (var i=0;i<displayElements.apriPageElements.length;i++) {
			displayElements.apriPageElements[i].style.height = (appFooterTop - apriHeaderHeight) + 'px';
		}

		var footerOffsetHeight, _top;
		for (var i=0;i<displayElements.apriPageFooterElements.length;i++) {
			footerOffsetHeight = displayElements.apriPageFooterElements[i].offsetHeight>0?displayElements.apriPageFooterElements[i].offsetHeight:footerOffsetHeight;
			_top = (appFooterTop - apriHeaderHeight - footerOffsetHeight) + 'px';
			displayElements.apriPageFooterElements[i].style.top = _top;
		}

		/* pages */
		for (var page in apriPages) {
			if (apriPages[page].active==true) apriPages[page].container.style.height = (appFooterTop - apriHeaderHeight - footerOffsetHeight)+ 'px';
		}
		
	};
	
	var displayElements;
	
//	var jsPixelRatio= function() {
//		var el = document.querySelector('.pixel-ratio-holder');
//		return window.getComputedStyle(document.querySelector('.pixel-ratio-holder'), 'before').getPropertyValue('content').replace(/[^a-z]/g,'') * 1;
//	}
	
	this.constructor = function(objectId, options) {
		//Execute the constructor of the class we extended.
        this.super(objectId, options);
		
		initApriPages();

		apriConfig 		= APRI.getConfig();
		apriClientInfo 	= APRI.getClientInfo();
		apriLeafLetBase = new ApriCore.ApriLeafLetBase();
				
		graphOptions 	= {}; 
		
		geoLocation = {};
		
		locationMapLayers = {};
		appConfig.viewZoomLevel = 13;
		appConfig.mapCenterLat	= 51.45401;
		appConfig.mapCenterLng	= 5.47668;
		//		viewCoordinates: [51.45401, 5.47668]

		
		secureSite 			= false;
		siteProtocol 		= secureSite?'https://':'http://';
		siteUrl				= siteProtocol + 'scapeler.com/SCAPE604';
		openiodUrl			= siteProtocol + 'openiod.com/SCAPE604';
		sitePrefixExtern	= ''; //'scapeler.com/extern/'
		displayElements		= {};
		
		apriForms 			= {};
		
		categories			= [
			  {category: { id:"airquality", label:"Luchtkwaliteit", question:"Hoe ervaart u de luchtkwaliteit?"
			  	, answers: [
					  {id:'01', label:'Goed'		, className:'answer-1of3', score:1, fase:'off' }
			  		, {id:'02', label:'Neutraal'	, className:'answer-2of3', score:2, fase:'off' }
			  		, {id:'03', label:'Slecht'		, className:'answer-3of3', score:3, fase:'off' }
			  		, {id:'99', label:'nvt'			, className:'answer-99of3', score:0, fase:'on' }
					]
				}}
			, {category: { id:"noicestress", label:"Geluidsdruk", question:"Heeft u last van omgevingsgeluiden?"
			  	, answers: [
					  {id:'01', label:'Nee'			, className:'answer-1of3', score:1, fase:'off' }
			  		, {id:'02', label:'Neutraal'	, className:'answer-2of3', score:2, fase:'off' }
			  		, {id:'03', label:'Ja'			, className:'answer-3of3', score:3, fase:'off' }
			  		, {id:'99', label:'nvt'			, className:'answer-99of3', score:0, fase:'on' }
					]
				}}
			, {category: { id:"trafficstress", label:"Verkeersdrukte", question:"Is er veel verkeer in u omgeving?"
			  	, answers: [
					  {id:'01', label:'Nee'			, className:'answer-1of3', score:1, fase:'off' }
			  		, {id:'02', label:'Neutraal'	, className:'answer-2of3', score:2, fase:'off' }
			  		, {id:'03', label:'Ja'			, className:'answer-3of3', score:3, fase:'off' }
			  		, {id:'99', label:'nvt'			, className:'answer-99of3', score:0, fase:'on' }
					]
				}}
			, {category: { id:"odorstress", label:"Geuroverlast", question:"Last van ongewenste geuren?"
			  	, answers: [
					  {id:'01', label:'Nee'			, className:'answer-1of3', score:1, fase:'off' }
			  		, {id:'02', label:'Neutraal'	, className:'answer-2of3', score:2, fase:'off' }
			  		, {id:'03', label:'Ja'			, className:'answer-3of3', score:3, fase:'off' }
			  		, {id:'99', label:'nvt'			, className:'answer-99of3', score:0, fase:'on' }
					]
				}}
		];
		
		introText = '<H3>Hoe beleeft u uw leefomgeving?</H3><img style="float:right;width:80%;" src="'+apriConfig.urlSystemRoot+'/client/apri-client-human-sensor/images/scapeler-od-idee.png"></img><BR><BR><BR>'; 

		succesText = '<H3>Bedankt voor uw deelname</H3>Uw antwoorden op de vragen over de beleving van de leefomgeving zijn belangrijk voor het onderzoek. Wij nodigen u vooral uit om deze vragen vaker te beantwoorden, zeker als daar aanleiding toe is. <BR><BR>Ga door naar de volgende pagina om de resultaten van de afgelopen periode te kunnen bekijken.<BR><BR><BR>'; 

		resultText = '<H3>Dit zijn de resultaten van het afgelopen uur. Hoe doet uw buurt het?</H3>TEST!<img style="float:right;width:70%;" src="'+apriConfig.urlSystemRoot+'/client/apri-client-human-sensor/images/resultaat-test.png"></img><BR><BR><BR>'; 

		
				
		
		getDeepLinkVars();

		
		appBodyContainer = document.getElementsByClassName('apri-app-body apri-client-human-sensor')[0];

		
		apriAjaxBase 	= new ApriCore.ApriAjaxBase();
		
		window.onbeforeunload = function(e) {
			e.preventDefault();
			return "Are you sure you want to navigate away?";
		};
		window.onunload = function(e) {
			e.preventDefault();
			return "Are you sure you want to navigate away2?";
		};
		
		document.addEventListener("apriResize",resizeApp);

		this.initView();
				
	}

/*	
var initGraphicTrend = function(options) {
		
		apriViewContainer.classList.add("loading-animation");
		apriAjaxBase.request(options.url + options.parameters, {}, options, createGraphicTrend, null );
		
}	
*/

var setOptionsParameters = function() {
//		graphOptions.parameters = ''; 
//		graphOptions.parameters += "&area=" 				+ graphOptions.area;
			
//		graphOptions.parameters	+= "&format=json";	
		
//		setPushState();
}

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
			
			/* screeninfo */
			displayElements.screenInfoElement 			= appBodyContainer.getElementsByClassName("apri-screen-info")[0];
			/* height app header fixed menu */
			displayElements.apriMenuFixedElement 		= appBodyContainer.getElementsByClassName("apri-menu-fixed")[0];
			/* position app footer */
			displayElements.apriMenuFooterFixedElement 	= appBodyContainer.getElementsByClassName("apri-menu-footer-fixed")[0];
			
			
			/* position pages */
			displayElements.apriPagesFixedElement 		= appBodyContainer.getElementsByClassName("apri-view-pages-fixed")[0];
			/* height per page */
			displayElements.apriPageElements 			= appBodyContainer.getElementsByClassName("apri-page");
			/* position pages footer */
			displayElements.apriPageFooterElements 		= appBodyContainer.getElementsByClassName("apri-page-footer");


			
			/* pages */
			/* intro page */
			apriPages.introPage.container				= appBodyContainer.getElementsByClassName("introPage")[0];
			apriPages.introPage.init();
			/* geolocation page */
			apriPages.locationPage.container			= appBodyContainer.getElementsByClassName("locationPage")[0];
			apriPages.locationPage.init();
			/* survey page */
			apriPages.surveyPage.container				= appBodyContainer.getElementsByClassName("surveyPage")[0];
			apriPages.surveyPage.init();
			/* succes page */
			apriPages.succesPage.container				= appBodyContainer.getElementsByClassName("succesPage")[0];
			apriPages.succesPage.init();
			/* result page */
			apriPages.resultPage.container				= appBodyContainer.getElementsByClassName("resultPage")[0];
			apriPages.resultPage.init();
			/* about page */
			apriPages.aboutPage.container				= appBodyContainer.getElementsByClassName("aboutPage")[0];
			apriPages.aboutPage.init();
			
									
			apriPages.introPage.activate();

		
			
			viewManager.parseViewBlocks(document.body);
			
			
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

		
		}, null);
			
	}
	
	var buttonPushed = function () {
		var buttons = this.parentElement.getElementsByClassName('apri-category-answer');
		for (var i=0;i<buttons.length;i++) {
			buttons[i].classList.remove('apri-category-answer-fase-on');
			buttons[i].classList.remove('apri-category-answer-fase-off');
			if (buttons[i]==this) {
				this.classList.add('apri-category-answer-fase-on');
			} else {
				buttons[i].classList.add('apri-category-answer-fase-off');
			}
		}
		
	};
	
	function ajaxGetData(url, callback ) {
		var xmlhttp;
		xmlhttp=new XMLHttpRequest();
		xmlhttp.onreadystatechange=function() {
  			if (xmlhttp.readyState==4 && xmlhttp.status==200) {
				callback(xmlhttp.responseText);
			}
  			if (xmlhttp.readyState==4 && xmlhttp.status==0) {
				callback(xmlhttp.responseText); // no internet connection
			}
  		}
		xmlhttp.open("GET",url,true);
		xmlhttp.send();
	}


	var nextPage = function () {
		var _nextPage = this.getAttribute("nextPage");
		var pageToActivate, pageToDeactivate;
		for (var page in apriPages ) {
			if (apriPages[page].active == true) {
				pageToDeactivate = page;
			}
			if (page == _nextPage) {
				pageToActivate = page;
			}
		}
		if (pageToDeactivate) apriPages[pageToDeactivate].deactivate();	
		if (pageToActivate) apriPages[pageToActivate].activate();	
		
		window.dispatchEvent(new Event('resize')); //force resize. Especially for leaflet maps
		
	};
	
	var sendData = function(data) {
//		http://openiod.com/SCAPE604/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&inputformat=insertom&objectid=humansensor&format=xml
//			&region=EHV		&lat=50.1		&lng=4.0		&category=airquality		&value=1

		var _url = openiodUrl + '/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&inputformat=executeinsertom&objectid=humansensor&format=xml';
		_url = _url + '&region=EHV' + '&lat=' + data.latlng.lat + '&lng=' + data.latlng.lng + '&category=' + data.category + '&value=' + data.value ;
		ajaxGetData(_url,
			function(data) {
				//var result = JSON.parse(data);
			}
		);

	}

		
	var getDeepLinkVars = function() {
			var i = 0; 
			var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
				if (key == 'dltype') return; //future extension eg. for encrypted deeplink variables
//				var areaIndChar = key.substr(0,1);
//				var areaIndInt;

			});

			return;
	};
	
	
	var setPushState = function() {
		var _variables = "";
		var _firstVar = true;
		var _areaIndex = "";
		var dltype = "1";	// deeplink type = '1'=standard, future: encoded dltype?
		_variables = _variables + "dltype=" + dltype + graphOptions.parameters;

		window.history.pushState({apri:'human-sensor'}, "human-sensor", "?" + _variables);
	};
	
	
	var geoFindMe = function(map) {
		//var output = element.getElementById("message");
		console.log('Execute geoFindMe');

		if (!navigator.geolocation){
//			element.innerHTML = "<p>Geolocation is not supported by your browser</p>";
			//element.innerHTML = "<p>Geolocatie bepalen is helaas niet mogelijk met deze browser</p>";
			return;
		}

		function success(position) {
			geoLocation.lat		= Math.round(position.coords.latitude*1000)/1000;
			geoLocation.lng		= Math.round(position.coords.longitude*1000 )/1000;
			
			if (geoLocation.lat != geoLocation.prevLat || geoLocation.lng != geoLocation.prevLng) {
				map.setView([geoLocation.lat, geoLocation.lng], appConfig.viewZoomLevel);
				if (geoLocation.marker == undefined) {
					geoLocation.marker 	= L.marker([geoLocation.lat, geoLocation.lng]).addTo(map);
				} else {
					geoLocation.marker.setLatLng([geoLocation.lat, geoLocation.lng]);
					geoLocation.marker.update();
				}
				geoLocation.prevLat	= geoLocation.lat;
				geoLocation.prevLng	= geoLocation.lng;
			};	
			
			//element.innerHTML = '<p>Latitude is ' + geoLocation.lat + '° <br>Longitude is ' + geoLocation.lng + '°</p>';

			//var img = new Image();
			//img.src = "https://maps.googleapis.com/maps/api/staticmap?center=" + geoLocation.lat + "," + geoLocation.lng + "&zoom=15&size=500x500&sensor=true";
			//img.style.width = '80%';
			////img.style.padding = '3rem';

			//element.appendChild(img);
		};

		function error() {
//			element.innerHTML = "Unable to retrieve your location";
			//element.innerHTML = "Een poging om uw locatie te bepalen is helaas mislukt. Probeer opnieuw of (her-)start het locatie bepalen op dit apparaat.";
			geoLocation = {};
		};

		//output.innerHTML = "<p>Locating…</p>";

		navigator.geolocation.getCurrentPosition(success, error);	
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
		result.serverProtocol 	= 'http';
		result.server			= 'openiod.com'; 
		result.serverPort 		= '80';
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
	
		//=== Page introPage functions =========
	
		apriPages.introPage	= {};
	
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
				nextPageElement.setAttribute('nextpage',nextPagePage);
				_pageActionsElement.appendChild(nextPageElement);
				nextPageElement.addEventListener('click', nextPage, false);
			}
		}

		apriPages.introPage.activate 	= function () {
			var _page = apriPages.introPage;
			setPageVisible(_page);
		}
		
		apriPages.introPage.pause 		= function () {
		}
		
		apriPages.introPage.deactivate 	= function () {
			var _page = apriPages.introPage;
			setPageHidden(_page);		}

		apriPages.introPage.close 		= function () {
		}
		
		//=== Page introPage functions End =========
		
		//=== Page introPage functions =========
	
		apriPages.locationPage	= {};
	
		apriPages.locationPage.init 		= function (container) {
		
			var _page 				= apriPages.locationPage;
			if (_page.displayElements == undefined) _page.displayElements = {};
			var _displayElements 	= _page.displayElements;
			_page.active 			= false;
			
			//			displayElements.introPage				= appBodyContainer.getElementsByClassName("intro-page")[0];
			_displayElements.pageBodyElement	= _page.container.getElementsByClassName("apri-view-body")[0];
			
			_displayElements.pageContentElement = document.createElement('div');
			//var introPageBodyBodyTextElement 	= introPage.getElementsByClassName("apri-view-body-body-text")[0];
			_displayElements.pageContentElement.innerHTML = locationText;
			_displayElements.pageBodyElement.appendChild(_displayElements.pageContentElement);

			_displayElements.locationPageMapElement = document.createElement('div');
			_displayElements.locationPageMapElement.style.height='30rem';
			

			_displayElements.pageBodyElement.appendChild(_displayElements.locationPageMapElement);


			/* create location map */
			var RDres = [3440.640, 1720.320, 860.160, 430.080, 215.040, 107.520, 53.760, 26.880, 13.440, 6.720, 3.360, 1.680, 0.840, 0.420];
			var RDcrs = L.CRS.proj4js('EPSG:28992', '+proj=sterea +lat_0=52.15616055555555 +lon_0=5.38763888888889 +k=0.9999079 +x_0=155000 +y_0=463000 +ellps=bessel +units=m +towgs84=565.2369,50.0087,465.658,-0.406857330322398,0.350732676542563,-1.8703473836068,4.0812 +no_defs', new L.Transformation(1, 285401.920, -1, 903401.920));
			RDcrs.scale = function(zoom) {
    			return 1 / res[zoom];
			};	
    		RDcrs.scale = function (zoom) {
        		return 1 / RDres[zoom];
    		};

			_page.geoLocationMap = L.map(_displayElements.locationPageMapElement).setView([appConfig.mapCenterLat, appConfig.mapCenterLng], appConfig.viewZoomLevel);
			 
			L.tileLayer.wms('http://www.openbasiskaart.nl/mapcache?SRS=EPSG%3A28992', {
				layers: 'osm',
				format: 'image/png',
				transparent: true,
				tiled: true,
				crs : RDcrs,
				attribution: '<a href="http://openstreetmap.org">OSM</a>',
				maxZoom: 18
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

			var _innerHTML = 'Ga door naar vragenlijst';
			var _pageActionsElement 	= _page.container.getElementsByClassName("apri-page-actions")[0];
			var nextPagePage = _pageActionsElement.getAttribute('nextpage');
			if (nextPagePage) {
				var nextPageElement = document.createElement('div');
				nextPageElement.innerHTML = _innerHTML;
				nextPageElement.setAttribute('nextpage',nextPagePage);
				_pageActionsElement.appendChild(nextPageElement);
				nextPageElement.addEventListener('click', nextPage, false);
			}

		}

		apriPages.locationPage.activate 	= function () {
			var _page = apriPages.locationPage;			
			setPageVisible(_page);
			
			_page.timerGeoLocation = setInterval(function() {geoFindMe(_page.geoLocationMap); }, 4000);  // reset geolocation every 4 sec
			
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
	
		apriPages.surveyPage	= {};
	
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
			
			var _innerHTML = 'Verzend uw keuzes';
			var _pageActionsElement 	= _page.container.getElementsByClassName("apri-page-actions")[0];
			var nextPagePage = _pageActionsElement.getAttribute('nextpage');
			if (nextPagePage) {
				var nextPageElement = document.createElement('div');
				nextPageElement.innerHTML = _innerHTML;
				nextPageElement.setAttribute('nextpage',nextPagePage);
				_pageActionsElement.appendChild(nextPageElement);
				nextPageElement.addEventListener('click', nextPage, false);
			}
			
			
			var categoryElement;
			var categoryTemplate = appBodyContainer.getElementsByClassName("apri-human-sensor-template-category")[0];
			for (var i=0;i<categories.length;i++) {
				var categoryContainer = document.createElement('div');
				categoryContainer.className 	= 'apri-category-container category-' + categories[i].category.id ;
				
				var categoryElementCopy = categoryTemplate.cloneNode(true);
				
				var categoryHeaderText = categoryElementCopy.getElementsByClassName("apri-view-header")[0];
				categoryHeaderText.innerHTML = '' + (i+1) + '. ' +categories[i].category.label;
				
				var categoryBodyElement = categoryElementCopy.getElementsByClassName("apri-view-body")[0];
				var answersContainerElement = document.createElement('div');
				answersContainerElement.className 	= 'apri-category-answers';
				categoryBodyElement.appendChild(answersContainerElement);
				var answerContainerFillBefore = document.createElement('div');
				answerContainerFillBefore.className 	= 'apri-category-answer-filler-before';
				answersContainerElement.appendChild(answerContainerFillBefore);
				for (var j=0;j<categories[i].category.answers.length;j++) {
					var answerContainer = document.createElement('div');
					if (categories[i].category.answers[j].id=='99') {
						answerContainer.className 	= 'apri-category-answer apri-category-answer-' + categories[i].category.id + ' ' + categories[i].category.answers[j].className + ' apri-category-answer-fase-' + categories[i].category.answers[j].fase + ' apri-category-answer-99 ' ;
					} else {
						answerContainer.className 	= 'apri-category-answer apri-category-answer-' + categories[i].category.id + ' ' + categories[i].category.answers[j].className + ' apri-category-answer-fase-' + categories[i].category.answers[j].fase;
					}
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
				var answerContainerFillAfter = document.createElement('div');
				answersContainerElement.appendChild(answerContainerFillAfter);
				categoryContainer.appendChild(categoryElementCopy);
				_displayElements.pageBodyElement.appendChild(categoryContainer);
			}
			
		}

		apriPages.surveyPage.activate 	= function () {
			var _page = apriPages.surveyPage;
			setPageVisible(_page);
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
	
		apriPages.succesPage	= {};
	
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
				nextPageElement.setAttribute('nextpage',nextPagePage);
				_pageActionsElement.appendChild(nextPageElement);
				nextPageElement.addEventListener('click', nextPage, false);
			}
		}

		apriPages.succesPage.activate 	= function () {
			var _page = apriPages.succesPage;
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
	
		apriPages.resultPage	= {};
	
		apriPages.resultPage.init 		= function (container) {
		
			var _page 				= apriPages.resultPage;
			if (_page.displayElements == undefined) _page.displayElements = {};
			var _displayElements 	= _page.displayElements;
			_page.active 			= false;
			
			//			displayElements.introPage				= appBodyContainer.getElementsByClassName("intro-page")[0];
			_displayElements.pageBodyElement	= _page.container.getElementsByClassName("apri-view-body")[0];
			
			_displayElements.pageContentElement = document.createElement('div');
			//var introPageBodyBodyTextElement 	= introPage.getElementsByClassName("apri-view-body-body-text")[0];
			_displayElements.pageContentElement.innerHTML = resultText;
			_displayElements.pageBodyElement.appendChild(_displayElements.pageContentElement);
			
			var _innerHTML = 'Ga door';
			var _pageActionsElement 	= _page.container.getElementsByClassName("apri-page-actions")[0];
			var nextPagePage = _pageActionsElement.getAttribute('nextpage');
			if (nextPagePage) {
				var nextPageElement = document.createElement('div');
				nextPageElement.innerHTML = _innerHTML;
				nextPageElement.setAttribute('nextpage',nextPagePage);
				_pageActionsElement.appendChild(nextPageElement);
				nextPageElement.addEventListener('click', nextPage, false);
			}
		}

		apriPages.resultPage.activate 	= function () {
			var _page = apriPages.resultPage;
			setPageVisible(_page);
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
	
		apriPages.aboutPage	= {};
	
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
				nextPageElement.setAttribute('nextpage',nextPagePage);
				_pageActionsElement.appendChild(nextPageElement);
				nextPageElement.addEventListener('click', nextPage, false);
			}
			
			/* content */
			
			var contentElement = document.createElement('div');
			var imgElement = document.createElement('img');
			imgElement.setAttribute('width', '90%');
			imgElement.setAttribute('src', 'http://www.aireas.com/wp-content/uploads/2014/01/JWK_7314-5-copy.jpg');
			contentElement.appendChild(imgElement);
			var textElement = document.createElement('div');
			//textElement.style.padding = '3rem';
			textElement.innerHTML = '<H1>Luchtmeting</H1><BR>In Eindhoven is in het najaar van 2013 het Innovatief Luchtmeetsysteem (ILM) geïnstalleerd. De 35 Airboxen die AiREAS in Eindhoven heeft geplaatst, meten fijnstof, ultrafijnstof, NO2 en ozon. Dertig van deze kastjes hebben een vaste plek aan lantaarnpalen verspreid over de stad, vijf worden mobiel ingezet. Dit gebeurt bijvoorbeeld bij evenementen of calamiteiten.<BR><BR><BR>'
			_displayElements.pageContentElement.appendChild(contentElement);
			_displayElements.pageContentElement.appendChild(textElement);

			
		}

		apriPages.aboutPage.activate 	= function () {
			var _page = apriPages.aboutPage;
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
		

		var setPageVisible = function (page) {
			page.container.classList.remove('apri-page-on');
			page.container.classList.remove('apri-page-off');
			page.container.classList.add('apri-page-on');
			page.active = true;
		}
		var setPageHidden = function (page) {
			page.container.classList.remove('apri-page-on');
			page.container.classList.remove('apri-page-off');
			page.container.classList.add('apri-page-off');
			page.active = false;
		}


	};
	//=== Page functions End =========

});
// ApriApp Class end ===============================================================================


