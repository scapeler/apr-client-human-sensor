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
	var siteProtocol, siteUrl;
	var sitePrefixExtern;
	
	var apriConfig, apriClientInfo;
	var appBodyContainer, apriViewContainer;

	var templates;
	var refreshButton;
	
	var viewBlocks;
	
	var viewFields;
	var apriAjaxBase, apriAjaxBaseQ, apriAjaxBase2;
	
	var aireasAvgType; // 'UFP', 'PM1', 'PM25', 'PM10', 'SPMI', 'OZON', 'NO2', 'CELC', 'HUM', 'AMBHUM', 'AMBTEMP'
	
	var graphicTrend;
	var graphOptions;
	
	var parsedUrl;
	
	var categories;
	var introText;	
	
	var introPage, locationPage, surveyPage, succesPage, resultPage, aboutPage; 
	
	this.constructor = function(objectId, options) {
		//Execute the constructor of the class we extended.
        this.super(objectId, options);
		
		secureSite 			= false;
		siteProtocol 		= secureSite?'https://':'http://';
		siteUrl				= siteProtocol + 'scapeler.com/SCAPE604';
		sitePrefixExtern	= ''; //'scapeler.com/extern/'
		
		apriForms 			= {};
		
		categories			= [
			  {category: { id:"airquality", label:"Luchtkwaliteit", question:"Hoe ervaart u de luchtkwaliteit?"
			  	, answers: [
					  {id:'01', label:'Goed'		, className:'answer-1of3', score:1, fase:'off' }
			  		, {id:'02', label:'Neutraal'	, className:'answer-2of3', score:2, fase:'off' }
			  		, {id:'03', label:'Slecht'		, className:'answer-3of3', score:3, fase:'off' }
			  		, {id:'99', label:'Geen keuze'	, className:'answer-99of3', score:0, fase:'on' }
					]
				}}
			, {category: { id:"noicestress", label:"Geluidsdruk", question:"Heeft u last van omgevingsgeluiden?"
			  	, answers: [
					  {id:'01', label:'Nee'			, className:'answer-1of3', score:1, fase:'off' }
			  		, {id:'02', label:'Neutraal'	, className:'answer-2of3', score:2, fase:'off' }
			  		, {id:'03', label:'Ja'			, className:'answer-3of3', score:3, fase:'off' }
			  		, {id:'99', label:'Geen keuze'	, className:'answer-99of3', score:0, fase:'on' }
					]
				}}
			, {category: { id:"trafficstress", label:"Verkeersdrukte", question:"Is er veel verkeer in u omgeving?"
			  	, answers: [
					  {id:'01', label:'Nee'			, className:'answer-1of3', score:1, fase:'off' }
			  		, {id:'02', label:'Neutraal'	, className:'answer-2of3', score:2, fase:'off' }
			  		, {id:'03', label:'Ja'			, className:'answer-3of3', score:3, fase:'off' }
			  		, {id:'99', label:'Geen keuze'	, className:'answer-99of3', score:0, fase:'on' }
					]
				}}
			, {category: { id:"odorstress", label:"Geuroverlast", question:"Last van ongewenste geuren?"
			  	, answers: [
					  {id:'01', label:'Nee'			, className:'answer-1of3', score:1, fase:'off' }
			  		, {id:'02', label:'Neutraal'	, className:'answer-2of3', score:2, fase:'off' }
			  		, {id:'03', label:'Ja'			, className:'answer-3of3', score:3, fase:'off' }
			  		, {id:'99', label:'Geen keuze'	, className:'answer-99of3', score:0, fase:'on' }
					]
				}}
		];
		
		introText = 'ghds aghfd ashgf dajhsgfd ajhgsf dhagsfd hjagfshdgafshgfd ajhgsfd hjagfsdhjgfa hsgfdhagfs hdgfahsgfd hagfshgdf ahgsfd hgafshjdgfa hjsgfdhjagfsdhjgafshdgfa hgsfd g'; 
		
				
		apriConfig = APRI.getConfig();
		apriClientInfo = APRI.getClientInfo();
				
		graphOptions = {}; 
		
		getDeepLinkVars();

		
		appBodyContainer = document.getElementsByClassName('apri-app-body apri-client-human-sensor')[0];

		
		apriAjaxBase 	= new ApriCore.ApriAjaxBase();

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
			
			var viewContainer 			= document.createElement('div');
			viewContainer.className 	= 'apri-view-container';
			viewContainer.innerHTML 	= html;
			appBodyContainer.appendChild(viewContainer);
			
			
			/* pages */
			/* intro page */
			introPage		= appBodyContainer.getElementsByClassName("intro-page")[0];
			var introPageBodyElement 	= introPage.getElementsByClassName("apri-view-body-body")[0];
			var introPageBodyBodyTextElement 	= introPage.getElementsByClassName("apri-view-body-body-text")[0];
			introPageBodyBodyTextElement.innerHTML = introPageBodyBodyTextElement.innerHTML+introText;
			var introPageActionNextPageElement 	= introPage.getElementsByClassName("apri-page-action-next-page")[0];
			introPageActionNextPageElement.addEventListener('click', nextPage, false);
						
			/* geolocation page */
			locationPage 		= appBodyContainer.getElementsByClassName("location-page")[0];
			var locationPageBodyElement 	= locationPage.getElementsByClassName("apri-view-body-body")[0];
			var locationPageActionNextPageElement 	= locationPage.getElementsByClassName("apri-page-action-next-page")[0];
			locationPageActionNextPageElement.addEventListener('click', nextPage, false);
			
			geoFindMe(locationPageBodyElement);

			/* survey page */
			surveyPage 		= appBodyContainer.getElementsByClassName("survey-page")[0];
			var surveyPageBodyElement 	= surveyPage.getElementsByClassName("apri-view-body-body")[0];
			var surveyPageActionNextPageElement 	= surveyPage.getElementsByClassName("apri-page-action-next-page")[0];
			surveyPageActionNextPageElement.addEventListener('click', nextPage, false);
			
			/* succes page */
			succesPage 		= appBodyContainer.getElementsByClassName("succes-page")[0];
			var succesPageBodyElement 	= succesPage.getElementsByClassName("apri-view-body-body")[0];
			var succesPageActionNextPageElement 	= succesPage.getElementsByClassName("apri-page-action-next-page")[0];
			succesPageActionNextPageElement.addEventListener('click', nextPage, false);

			/* result page */
			resultPage 		= appBodyContainer.getElementsByClassName("result-page")[0];
			var resultPageBodyElement 	= resultPage.getElementsByClassName("apri-view-body-body")[0];
			var resultPageActionNextPageElement 	= resultPage.getElementsByClassName("apri-page-action-next-page")[0];
			resultPageActionNextPageElement.addEventListener('click', nextPage, false);
			
			

			/* about page */
			aboutPage 		= appBodyContainer.getElementsByClassName("about-page")[0];
			var aboutPageBodyElement 	= aboutPage.getElementsByClassName("apri-view-body-body")[0];
			var aboutPageActionNextPageElement 	= aboutPage.getElementsByClassName("apri-page-action-next-page")[0];
			aboutPageActionNextPageElement.addEventListener('click', nextPage, false);

		
			var categoryElement;
			var categoryTemplate = appBodyContainer.getElementsByClassName("apri-human-sensor-template-category")[0];
			for (var i=0;i<categories.length;i++) {
				var categoryContainer = document.createElement('div');
				categoryContainer.className 	= 'apri-category-container category-' + categories[i].category.id ;
				
				var categoryElementCopy = categoryTemplate.cloneNode(true);
				
				var categoryHeaderText = categoryElementCopy.getElementsByClassName("apri-view-header-text")[0];
				categoryHeaderText.innerHTML = '' + (i+1) + '. ' +categories[i].category.label;
				
				var categoryBodyElement = categoryElementCopy.getElementsByClassName("apri-view-body")[0];
				for (var j=0;j<categories[i].category.answers.length;j++) {
					var answerElement = document.createElement('div');
					answerElement.className 	= 'apri-category-answer apri-category-answer-' + categories[i].category.id + ' ' + categories[i].category.answers[j].className + ' apri-category-answer-fase-' + categories[i].category.answers[j].fase;
					categoryBodyElement.appendChild(answerElement);
					answerElement.addEventListener("click", buttonPushed, false);
				}
				categoryContainer.appendChild(categoryElementCopy);
				surveyPageBodyElement.appendChild(categoryContainer);
			}
			
			
			viewManager.parseViewBlocks(document.body);
			

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
	

	var nextPage = function () {
		var pages = appBodyContainer.getElementsByClassName('apri-page');
		for (var i=0;i<pages.length;i++) {
			pages[i].classList.remove('apri-page-on');
			pages[i].classList.remove('apri-page-off');
			if (pages[i].getAttribute("pageName") == this.getAttribute("nextPage") ) {
				pages[i].classList.add('apri-page-on');
			} else {
				pages[i].classList.add('apri-page-off');
			}
		}
		
	};

		
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
	
	
	var geoFindMe = function(element) {
		//var output = element.getElementById("message");

		if (!navigator.geolocation){
			element.innerHTML = "<p>Geolocation is not supported by your browser</p>";
			return;
		}

		function success(position) {
			var latitude  = position.coords.latitude;
			var longitude = position.coords.longitude;

			element.innerHTML = '<p>Latitude is ' + latitude + '° <br>Longitude is ' + longitude + '°</p>';

			var img = new Image();
			img.src = "https://maps.googleapis.com/maps/api/staticmap?center=" + latitude + "," + longitude + "&zoom=15&size=500x500&sensor=true";

			element.appendChild(img);
		};

		function error() {
			element.innerHTML = "Unable to retrieve your location";
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





});
// ApriApp Class end ===============================================================================

