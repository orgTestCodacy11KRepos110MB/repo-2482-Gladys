const sinon = require('sinon');
const { expect } = require('chai');

const { fake, assert } = sinon;
const TasmotaHandler = require('../../../../../services/tasmota/lib');
const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
  EVENTS,
  WEBSOCKET_MESSAGE_TYPES,
} = require('../../../../../utils/constants');

const messages = require('./AM2301.json');

const mqttService = {
  device: {
    publish: fake.returns(null),
  },
};
const gladys = {
  event: {
    emit: fake.returns(null),
  },
  stateManager: {
    get: fake.returns(null),
  },
};
const serviceId = 'service-uuid-random';

describe('TasmotaHandler - create device with AM2301 temp/humidity features', () => {
  const tasmotaHandler = new TasmotaHandler(gladys, serviceId);

  beforeEach(() => {
    tasmotaHandler.mqttService = mqttService;
    sinon.reset();
  });

  it('decode STATUS message', () => {
    tasmotaHandler.handleMqttMessage('stat/tasmota-device-topic/STATUS', JSON.stringify(messages.STATUS));

    expect(tasmotaHandler.mqttDevices).to.deep.eq({});
    expect(tasmotaHandler.pendingMqttDevices).to.deep.eq({
      'tasmota-device-topic': {
        name: 'Tasmota',
        model: 18,
        external_id: 'tasmota:tasmota-device-topic',
        selector: 'tasmota-tasmota-device-topic',
        service_id: serviceId,
        should_poll: false,
        features: [],
      },
    });

    assert.notCalled(gladys.event.emit);
    assert.notCalled(gladys.stateManager.get);
    assert.calledWith(mqttService.device.publish, 'cmnd/tasmota-device-topic/STATUS', '11');
  });

  it('decode STATUS11 message', () => {
    tasmotaHandler.handleMqttMessage('stat/tasmota-device-topic/STATUS11', JSON.stringify(messages.STATUS11));

    expect(tasmotaHandler.mqttDevices).to.deep.eq({});
    expect(tasmotaHandler.pendingMqttDevices).to.deep.eq({
      'tasmota-device-topic': {
        name: 'Tasmota',
        model: 18,
        external_id: 'tasmota:tasmota-device-topic',
        selector: 'tasmota-tasmota-device-topic',
        service_id: serviceId,
        should_poll: false,
        features: [],
      },
    });

    assert.notCalled(gladys.event.emit);
    assert.notCalled(gladys.stateManager.get);
    assert.calledWith(mqttService.device.publish, 'cmnd/tasmota-device-topic/STATUS', '8');
  });

  it('decode STATUS8 message', () => {
    tasmotaHandler.handleMqttMessage('stat/tasmota-device-topic/STATUS8', JSON.stringify(messages.STATUS8));

    const expectedDevice = {
      name: 'Tasmota',
      model: 18,
      external_id: 'tasmota:tasmota-device-topic',
      selector: 'tasmota-tasmota-device-topic',
      service_id: serviceId,
      should_poll: false,
      features: [
        {
          category: DEVICE_FEATURE_CATEGORIES.HUMIDITY_SENSOR,
          type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
          unit: DEVICE_FEATURE_UNITS.PERCENT,
          external_id: 'tasmota:tasmota-device-topic:AM2301:Humidity',
          selector: 'tasmota-tasmota-device-topic-am2301-humidity',
          name: 'Humidity',
          read_only: true,
          has_feedback: false,
          min: 0,
          max: 100,
          last_value: 65,
        },
        {
          category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
          type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
          unit: DEVICE_FEATURE_UNITS.CELSIUS,
          external_id: 'tasmota:tasmota-device-topic:AM2301:Temperature',
          selector: 'tasmota-tasmota-device-topic-am2301-temperature',
          name: 'Temperature',
          read_only: true,
          has_feedback: false,
          min: -100,
          max: 200,
          last_value: 23,
        },
      ],
    };
    expect(tasmotaHandler.mqttDevices).to.deep.eq({
      'tasmota-device-topic': expectedDevice,
    });
    expect(tasmotaHandler.pendingMqttDevices).to.deep.eq({});

    assert.notCalled(mqttService.device.publish);
    assert.calledWith(gladys.stateManager.get, 'deviceByExternalId', 'tasmota:tasmota-device-topic');

    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'tasmota:tasmota-device-topic:AM2301:Temperature',
      state: 23,
    });
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'tasmota:tasmota-device-topic:AM2301:Humidity',
      state: 65,
    });
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.TASMOTA.NEW_DEVICE,
      payload: expectedDevice,
    });
  });
});
