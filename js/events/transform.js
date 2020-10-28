const mathUtils = require('../core/utils/math');
const iteratorUtils = require('../core/utils/iterator');
const errors = require('../core/errors');
const eventUtils = require('./utils');
const Emitter = require('./core/emitter');
const registerEmitter = require('./core/emitter_registrator');


const DX_PREFIX = 'dx';

const TRANSFORM = 'transform';
const TRANSLATE = 'translate';
const ZOOM = 'zoom';
const PINCH = 'pinch';
const ROTATE = 'rotate';

const START_POSTFIX = 'start';
const UPDATE_POSTFIX = '';
const END_POSTFIX = 'end';


const eventAliases = [];
const addAlias = function(eventName, eventArgs) {
    eventAliases.push({
        name: eventName,
        args: eventArgs
    });
};

addAlias(TRANSFORM, {
    scale: true,
    deltaScale: true,
    rotation: true,
    deltaRotation: true,
    translation: true,
    deltaTranslation: true
});

addAlias(TRANSLATE, {
    translation: true,
    deltaTranslation: true
});

addAlias(ZOOM, {
    scale: true,
    deltaScale: true
});

addAlias(PINCH, {
    scale: true,
    deltaScale: true
});

addAlias(ROTATE, {
    rotation: true,
    deltaRotation: true
});


const getVector = function(first, second) {
    return {
        x: second.pageX - first.pageX,
        y: -second.pageY + first.pageY,
        centerX: (second.pageX + first.pageX) * 0.5,
        centerY: (second.pageY + first.pageY) * 0.5
    };
};

const getEventVector = function(e) {
    const pointers = e.pointers;

    return getVector(pointers[0], pointers[1]);
};

const getDistance = function(vector) {
    return Math.sqrt(vector.x * vector.x + vector.y * vector.y);
};

const getScale = function(firstVector, secondVector) {
    return getDistance(firstVector) / getDistance(secondVector);
};

const getRotation = function(firstVector, secondVector) {
    const scalarProduct = firstVector.x * secondVector.x + firstVector.y * secondVector.y;
    const distanceProduct = getDistance(firstVector) * getDistance(secondVector);

    if(distanceProduct === 0) {
        return 0;
    }

    const sign = mathUtils.sign(firstVector.x * secondVector.y - secondVector.x * firstVector.y);
    const angle = Math.acos(mathUtils.fitIntoRange(scalarProduct / distanceProduct, -1, 1));

    return sign * angle;
};

const getTranslation = function(firstVector, secondVector) {
    return {
        x: firstVector.centerX - secondVector.centerX,
        y: firstVector.centerY - secondVector.centerY
    };
};

const TransformEmitter = Emitter.inherit({

    configure: function(data, eventName) {
        if(eventName.indexOf(ZOOM) > -1) {
            errors.log('W0005', eventName, '15.1', 'Use \'' + eventName.replace(ZOOM, PINCH) + '\' event instead');
        }

        this.callBase(data);
    },

    validatePointers: function(e) {
        return eventUtils.hasTouches(e) > 1;
    },

    start: function(e) {
        this._accept(e);

        const startVector = getEventVector(e);
        this._startVector = startVector;
        this._prevVector = startVector;

        this._fireEventAliases(START_POSTFIX, e);
    },

    move: function(e) {
        const currentVector = getEventVector(e);
        const eventArgs = this._getEventArgs(currentVector);

        this._fireEventAliases(UPDATE_POSTFIX, e, eventArgs);
        this._prevVector = currentVector;
    },

    end: function(e) {
        const eventArgs = this._getEventArgs(this._prevVector);
        this._fireEventAliases(END_POSTFIX, e, eventArgs);
    },

    _getEventArgs: function(vector) {
        return {
            scale: getScale(vector, this._startVector),
            deltaScale: getScale(vector, this._prevVector),
            rotation: getRotation(vector, this._startVector),
            deltaRotation: getRotation(vector, this._prevVector),
            translation: getTranslation(vector, this._startVector),
            deltaTranslation: getTranslation(vector, this._prevVector)
        };
    },

    _fireEventAliases: function(eventPostfix, originalEvent, eventArgs) {
        eventArgs = eventArgs || {};

        iteratorUtils.each(eventAliases, (function(_, eventAlias) {
            const args = {};
            iteratorUtils.each(eventAlias.args, function(name) {
                if(name in eventArgs) {
                    args[name] = eventArgs[name];
                }
            });

            this._fireEvent(DX_PREFIX + eventAlias.name + eventPostfix, originalEvent, args);
        }).bind(this));
    }

});


/**
 * @name UI Events.dxtransformstart
 * @type eventType
 * @type_function_param1 event:event
 * @type_function_param1_field1 cancel:boolean
 * @module events/transform
*/
/**
  * @name UI Events.dxtransform
  * @type eventType
  * @type_function_param1 event:event
  * @type_function_param1_field1 scale:number
  * @type_function_param1_field2 deltaScale:number
  * @type_function_param1_field3 rotation:number
  * @type_function_param1_field4 deltaRotation:number
  * @type_function_param1_field5 translation:object
  * @type_function_param1_field6 deltaTranslation:object
  * @type_function_param1_field7 cancel:boolean
  * @module events/transform
*/
/**
  * @name UI Events.dxtransformend
  * @type eventType
  * @type_function_param1 event:event
  * @type_function_param1_field1 scale:number
  * @type_function_param1_field2 deltaScale:number
  * @type_function_param1_field3 rotation:number
  * @type_function_param1_field4 deltaRotation:number
  * @type_function_param1_field5 translation:object
  * @type_function_param1_field6 deltaTranslation:object
  * @type_function_param1_field7 cancel:boolean
  * @module events/transform
*/

/**
 * @name UI Events.dxtranslatestart
 * @type eventType
 * @type_function_param1 event:event
 * @type_function_param1_field1 cancel:boolean
 * @module events/transform
*/
/**
  * @name UI Events.dxtranslate
  * @type eventType
  * @type_function_param1 event:event
  * @type_function_param1_field1 translation:object
  * @type_function_param1_field2 deltaTranslation:object
  * @type_function_param1_field3 cancel:boolean
  * @module events/transform
*/
/**
  * @name UI Events.dxtranslateend
  * @type eventType
  * @type_function_param1 event:event
  * @type_function_param1_field1 translation:object
  * @type_function_param1_field2 deltaTranslation:object
  * @type_function_param1_field3 cancel:boolean
  * @module events/transform
*/

/**
 * @name UI Events.dxzoomstart
 * @type eventType
 * @deprecated UI Events.dxpinchstart
 * @type_function_param1 event:event
 * @type_function_param1_field1 cancel:boolean
 * @module events/transform
*/
/**
  * @name UI Events.dxzoom
  * @type eventType
  * @deprecated UI Events.dxpinch
  * @type_function_param1 event:event
  * @type_function_param1_field1 scale:number
  * @type_function_param1_field2 deltaScale:number
  * @type_function_param1_field3 cancel:boolean
  * @module events/transform
*/
/**
  * @name UI Events.dxzoomend
  * @type eventType
  * @deprecated UI Events.dxpinchend
  * @type_function_param1 event:event
  * @type_function_param1_field1 scale:number
  * @type_function_param1_field2 deltaScale:number
  * @type_function_param1_field3 cancel:boolean
  * @module events/transform
*/

/**
* @name UI Events.dxpinchstart
* @type eventType
* @type_function_param1 event:event
* @type_function_param1_field1 cancel:boolean
* @module events/transform
   */
/**
  * @name UI Events.dxpinch
  * @type eventType
  * @type_function_param1 event:event
  * @type_function_param1_field1 scale:number
  * @type_function_param1_field2 deltaScale:number
  * @type_function_param1_field3 cancel:boolean
  * @module events/transform
*/
/**
  * @name UI Events.dxpinchend
  * @type eventType
  * @type_function_param1 event:event
  * @type_function_param1_field1 scale:number
  * @type_function_param1_field2 deltaScale:number
  * @type_function_param1_field3 cancel:boolean
  * @module events/transform
*/

/**
 * @name UI Events.dxrotatestart
 * @type eventType
 * @type_function_param1 event:event
 * @type_function_param1_field1 cancel:boolean
 * @module events/transform
*/
/**
  * @name UI Events.dxrotate
  * @type eventType
  * @type_function_param1 event:event
  * @type_function_param1_field1 rotation:number
  * @type_function_param1_field2 deltaRotation:number
  * @type_function_param1_field3 cancel:boolean
  * @module events/transform
*/
/**
  * @name UI Events.dxrotateend
  * @type eventType
  * @type_function_param1 event:event
  * @type_function_param1_field1 rotation:number
  * @type_function_param1_field2 deltaRotation:number
  * @type_function_param1_field3 cancel:boolean
  * @module events/transform
*/

const eventNames = eventAliases.reduce((result, eventAlias) => {
    [START_POSTFIX, UPDATE_POSTFIX, END_POSTFIX].forEach(eventPostfix => {
        result.push(DX_PREFIX + eventAlias.name + eventPostfix);
    });
    return result;
}, []);

registerEmitter({
    emitter: TransformEmitter,
    events: eventNames
});

iteratorUtils.each(eventNames, function(_, eventName) {
    exports[eventName.substring(DX_PREFIX.length)] = eventName;
});