define([
    'postmonger'
], function(
    Postmonger
) {
    'use strict';
	
    var connection = new Postmonger.Session();
    var payload = {};
    var authToken;
    var hearsayfields = {};
    var lastStepEnabled = false;
    var steps = [ // initialize to the same value as what's set in config.json for consistency
        { "label": "Template Selection", "key": "step1" },
        { "label": "Map the Template Field", "key": "step2", "active": false},
        { "label": "Review Template Field", "key": "step3", "active": false}
    ];
    var currentStep = steps[0].key;

    $(window).ready(onRender);

    connection.on('initActivity', initialize);
    connection.on('requestedTokens', onGetTokens);
    connection.on('requestedEndpoints', onGetEndpoints);
    connection.on('requestedSchema', onRequestSchema);

    connection.on('clickedNext', onClickedNext);
    connection.on('clickedBack', onClickedBack);
    connection.on('gotoStep', onGotoStep);

    function onRender() {
        $('#inputField-01').hide();
        // JB will respond the first time 'ready' is called with 'initActivity'
        connection.trigger('ready');

        connection.trigger('requestTokens');
        connection.trigger('requestEndpoints');
        connection.trigger('requestSchema');
        // Disable the next button if a value isn't selected
	$('.slds-select.hearsay').on('change', function(event) {
		$('.slds-select.hearsay').find('option').show();
		intializeSelectHearsay(event.target.id);
	});

	$('.slds-select.journey').on('change', function(event) {
		$('.slds-select.journey').find('option').show();
		intializeSelectJourney(event.target.id);
	});
	    
        $('#select-01').change(function() {
            var message = getIntegrationName('#select-01');
            console.log('message value '+message);
            if(message == 'Current Journey'){
                lastStepEnabled = !lastStepEnabled; // toggle status
                steps[1].active = true;
                steps[2].active = true; // toggle active
                $('#inputField-01').show();
                connection.trigger('updateSteps', steps);
            } else {
                //reviewPageEnabled = false; // toggle status
                steps[2].active = true;
                steps[1].active = false; // toggle active
                $('#inputField-01').hide();
                connection.trigger('updateSteps', steps);
            }
            //$('#message').html(message);
        });
    }

    function initialize (data) {
        var intTypeValue;
        if (data) {
            payload = data;
            intTypeValue = payload.name;
        }
        
        var mapfields;
        var hasInArguments = Boolean(
            payload['arguments'] &&
            payload['arguments'].execute &&
            payload['arguments'].execute.inArguments &&
            payload['arguments'].execute.inArguments.length > 0
        );

        var inArguments = hasInArguments ? payload['arguments'].execute.inArguments : {};

        $.each(inArguments, function(index, inArgument) {
            $.each(inArgument, function(key, val) {
                if (key === 'hearsayfields') {
                    mapfields = val;
                }
            });
        });

        if (intTypeValue) {
            $("#select-01 option").filter(function() {
	    	return this.text == intTypeValue; 
	    }).attr('selected', true);
	    if(intTypeValue == 'Current Journey'){
		    steps[1].active = true;
		    steps[2].active = true; // toggle active
		    $('#inputField-01').show();
		    connection.trigger('updateSteps', steps);
	    } else {
		    steps[2].active = true;
                    steps[1].active = false; // toggle active
                    $('#inputField-01').hide();
                    connection.trigger('updateSteps', steps);
	    }
        }
        // If there is no message selected, disable the next button
        if (!mapfields) {
            showStep(null, 1);
            connection.trigger('updateButton', { button: 'next', enabled: false });
            // If there is a intTypeValue, skip to the summary step
        } else {
            var div_data = '';
            for (var key in mapfields) {
                if (mapfields.hasOwnProperty(key)) {
                    var val = mapfields[key];
                    console.log('key '+key);
                    console.log('value '+val);
                    div_data += "<li>"+key+' : '+val+"</li>";
                }
            }
            $('#intTypeValues').html(div_data);
            showStep(null, 3);
        }
    }
    
    function intializeSelectJourney(targetId) {
	// this "initializes the boxes"
	$('.slds-select.journey').each(function(box) {
		var value = $('.slds-select.journey')[box].value;
		var thisElement = this.id;
		if (value) {
			$('.slds-select.journey').not(this).find('option[value="' + value + '"]').hide();
		}
		
		if ((targetId === thisElement) && value) {
		    const div_data = '<div class="slds-progress-ring slds-progress-ring_complete">' +
			'<div class="slds-progress-ring__progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100">' +
			'<svg viewBox="-1 -1 2 2">' +
			'<circle class="slds-progress-ring__path" id="slds-progress-ring-path-44" cx="0" cy="0" r="1"></circle>' +
			'</svg>' +
			'</div>' +
			'<div class="slds-progress-ring__content">' +
			'<span class="slds-icon_container slds-icon-utility-check" title="Complete">' +
			'<svg class="slds-icon" aria-hidden="true">'+
			'<use xlink:href="assets/styles/icons/utility-sprite/svg/symbols.svg#check"></use>'+
			'</svg>'+
			'<span class="slds-assistive-text">Complete</span>' +
			'</span>' +
			'</div>' +
			'</div>'
		    $('#' + thisElement + '-ring').html(div_data);
		} else if ((targetId === thisElement) && !value) {
		    const div_data = '<div class="slds-progress-ring slds-progress-ring_expired">'+
				'<div class="slds-progress-ring__progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">'+
				'<svg viewBox="-1 -1 2 2">'+
				'<path class="slds-progress-ring__path" id="slds-progress-ring-path-46" d="M 1 0 A 1 1 0 0 1 1.00 0.00 L 0 0"></path>'+
				'</svg>'+
				'</div>'+
				'<div class="slds-progress-ring__content">'+thisElement.charAt(thisElement.length - 1)+'</div>'+
				'</div>'
		    $('#' + thisElement + '-ring').html(div_data);
		}
	});
    };
    
    function intializeSelectHearsay(targetId) {
	// this "initializes the boxes"
	$('.slds-select.hearsay').each(function(box) {
		var value = $('.slds-select.hearsay')[box].value;
		var thisElement = this.id;
		if (value) {
			$('.slds-select.hearsay').not(this).find('option[value="' + value + '"]').hide();
		}
		
		if ((targetId === thisElement) && value) {
		    const div_data = '<div class="slds-progress-ring slds-progress-ring_complete">' +
			'<div class="slds-progress-ring__progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100">' +
			'<svg viewBox="-1 -1 2 2">' +
			'<circle class="slds-progress-ring__path" id="slds-progress-ring-path-44" cx="0" cy="0" r="1"></circle>' +
			'</svg>' +
			'</div>' +
			'<div class="slds-progress-ring__content">' +
			'<span class="slds-icon_container slds-icon-utility-check" title="Complete">' +
			'<svg class="slds-icon" aria-hidden="true">'+
			'<use xlink:href="assets/styles/icons/utility-sprite/svg/symbols.svg#check"></use>'+
			'</svg>'+
			'<span class="slds-assistive-text">Complete</span>' +
			'</span>' +
			'</div>' +
			'</div>'
		    $('#' + thisElement + '-ring').html(div_data);
		} else if ((targetId === thisElement) && !value) {
		    const div_data = '<div class="slds-progress-ring slds-progress-ring_expired">' +
			'<div class="slds-progress-ring__progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">' +
			'<svg viewBox="-1 -1 2 2">' +
			'<path class="slds-progress-ring__path" id="slds-progress-ring-path-46" d="M 1 0 A 1 1 0 0 1 1.00 0.00 L 0 0"></path>' +
			'</svg>' +
			'</div>' +
			'<div class="slds-progress-ring__content" style="background: gray"></div>' +
			'</div>'
		    $('#' + thisElement + '-ring').html(div_data);
		}
	});
    };

    function onGetTokens (tokens) {
        // Response: tokens = { token: <legacy token>, fuel2token: <fuel api token> }
         console.log(tokens);
	    authToken = tokens.token;
    }
    
    function onRequestSchema(data){
        console.log('*** Schema ***', JSON.stringify(data['schema']));
	for (var x in data['schema']) {
	  console.log('*** Iterate Schema ***', x);
	  var keyfield = data['schema'][x].key.split('.').pop();
	  console.log('keyfields '+keyfield);
	  $('#select-journey1').append('<option value="'+keyfield.replaceAll(" ", "_")+'">'+keyfield.charAt(0).toUpperCase() + keyfield.slice(1)+'</option>');
	  $('#select-journey2').append('<option value="'+keyfield.replaceAll(" ", "_")+'">'+keyfield.charAt(0).toUpperCase() + keyfield.slice(1)+'</option>');
	  $('#select-journey3').append('<option value="'+keyfield.replaceAll(" ", "_")+'">'+keyfield.charAt(0).toUpperCase() + keyfield.slice(1)+'</option>');
	  $('#select-journey4').append('<option value="'+keyfield.replaceAll(" ", "_")+'">'+keyfield.charAt(0).toUpperCase() + keyfield.slice(1)+'</option>');
	  $('#select-journey5').append('<option value="'+keyfield.replaceAll(" ", "_")+'">'+keyfield.charAt(0).toUpperCase() + keyfield.slice(1)+'</option>');	
	  $('#select-journey6').append('<option value="'+keyfield.replaceAll(" ", "_")+'">'+keyfield.charAt(0).toUpperCase() + keyfield.slice(1)+'</option>');
	  $('#select-journey7').append('<option value="'+keyfield.replaceAll(" ", "_")+'">'+keyfield.charAt(0).toUpperCase() + keyfield.slice(1)+'</option>');
	  $('#select-journey8').append('<option value="'+keyfield.replaceAll(" ", "_")+'">'+keyfield.charAt(0).toUpperCase() + keyfield.slice(1)+'</option>');	
	}
    }

    function onGetEndpoints (endpoints) {
        // Response: endpoints = { restHost: <url> } i.e. "rest.s1.qa1.exacttarget.com"
         console.log(endpoints);
    }

    function onClickedNext () {
	var selectOption = getIntegrationType('#select-01');
        if (currentStep.key === 'step3') {
            save();
        } else if(currentStep.key === 'step1' && selectOption == 'CurrentJourney'){
            var input = $('#text-input-id-1')[0];
            var validityState_object = input.validity;
            if (validityState_object.valueMissing){
                
                    input.setCustomValidity('Must enter your template name!');
                    input.reportValidity();
                showStep(null, 1);
                connection.trigger('ready');
            } else {
                var myHeaders = new Headers();
                myHeaders.append("Content-Type", "text/xml");
		    
		var DEName = $('#text-input-id-1').val(); 	
                const data = { dename: DEName }
		
		fetch("/validate/dataextension/", {
		  method: "POST",
		  headers: {
		    'Accept': 'text/xml',
		    'Content-Type': 'text/xml'
		  },
		  body: JSON.stringify(data),
		})
		.then(response => response.text())
		.then(data => {
		  console.log('Success:', data);
		})
		.catch((error) => {
		  console.error('Error:', error);
		});		    
                connection.trigger('nextStep');
            }
        } else if(currentStep.key === 'step2'){
            if(getIntegrationName('#select-journey1') != '--Select--') hearsayfields [getIntegrationType('#select-journey1')] = getIntegrationType('#select-hearsay1');
            if(getIntegrationName('#select-journey2') != '--Select--') hearsayfields [getIntegrationType('#select-journey2')] = getIntegrationType('#select-hearsay2');
            if(getIntegrationName('#select-journey3') != '--Select--') hearsayfields [getIntegrationType('#select-journey3')] = getIntegrationType('#select-hearsay3');
            if(getIntegrationName('#select-journey4') != '--Select--') hearsayfields [getIntegrationType('#select-journey4')] = getIntegrationType('#select-hearsay4');
            if(getIntegrationName('#select-journey5') != '--Select--') hearsayfields [getIntegrationType('#select-journey5')] = getIntegrationType('#select-hearsay5');
            if(getIntegrationName('#select-journey6') != '--Select--') hearsayfields [getIntegrationType('#select-journey6')] = getIntegrationType('#select-hearsay6');
            if(getIntegrationName('#select-journey7') != '--Select--') hearsayfields [getIntegrationType('#select-journey7')] = getIntegrationType('#select-hearsay7');
            if(getIntegrationName('#select-journey8') != '--Select--') hearsayfields [getIntegrationType('#select-journey8')] = getIntegrationType('#select-hearsay8');
            console.log('hearsayfields '+hearsayfields);
	    var div_data = '';
	    for (var key in hearsayfields) {
	    	if (hearsayfields.hasOwnProperty(key)) {
			var val = hearsayfields[key];
			console.log('key '+key);
			console.log('value '+val);
			div_data += "<li>"+key+' : '+val+"</li>";
		}
	    }
	    $('#intTypeValues').html(div_data);
            connection.trigger('nextStep');
	    }
    }

    function onClickedBack () {
        connection.trigger('prevStep');
    }

    function onGotoStep (step) {
        showStep(step);
        connection.trigger('ready');
    }

    function showStep(step, stepIndex) {
        if (stepIndex && !step) {
            step = steps[stepIndex-1];
        }

        currentStep = step;

        $('.step').hide();

         switch(currentStep.key) {
            case 'step1':
                $('#step1').show();
                connection.trigger('updateButton', {
                    button: 'next',
                    enabled: Boolean(getIntegrationType('#select-01'))
                });
                connection.trigger('updateButton', {
                    button: 'back',
                    visible: false
                });
                break;
            case 'step2':
                $('#step2').show();
                connection.trigger('updateButton', {
                    button: 'back',
                    visible: true
                });
                if (lastStepEnabled) {
                    connection.trigger('updateButton', {
                        button: 'next',
                        text: 'next',
                        visible: true
                    });
                } else {
                    connection.trigger('updateButton', {
                        button: 'next',
                        text: 'done',
                        visible: true
                    });
                }
                break;
            case 'step3':
                $('#step3').show();
                connection.trigger('updateButton', {
                     button: 'back',
                     visible: true
                });
                connection.trigger('updateButton', {
                     button: 'next',
                     text: 'done',
                     visible: true
                });
                break;
        }
    }

    function save() {
        var name = getIntegrationName('#select-01');

        payload.name = name;
        console.log('hearsayfields '+hearsayfields);
        payload['arguments'].execute.inArguments = [{ "hearsayfields": hearsayfields }];

        payload['metaData'].isConfigured = true;

        connection.trigger('updateActivity', payload);
    }

    function getIntegrationType(elementID) {
        return $(elementID).find('option:selected').attr('value').trim();
    }

    function getIntegrationName(elementID) {
        return $(elementID).find('option:selected').html();
    }
});
