import { List, Map} from 'immutable';
import uuid from 'node-uuid';
import moment from 'moment';
import _ from 'lodash';

import {
	INIT_CONNECTION,
    SET_CONNECTED,
    SET_CURRENT_NICK,
    RECEIVE_MESSAGE,
    SET_CHANNEL_TOPIC,
    SET_CHANNEL_USERS,
    SET_CURRENT_CHANNEL,
    JOIN_CHANNEL,
    PART_CHANNEL,
    MESSAGE_TO_CHANNEL,
    NEW_MESSAGE_RECEIVED,
    USER_JOINS_CHANNEL,
    USER_PARTS_CHANNEL
} from '../actions/irc-actions';

const defaultState = {
    io: null,
    messages: List(),
    channels: Map(),
    users: List(),
    nick: null,
    currentChannel: null,
    connected: false,
    topic: null,
    newMessageOwner: null
};

function channelStructure() {
    return {
        name: null,
        topic: null,
        messages: List(),
        users: List()
    };
}

function sortUsers(users) {
    const ops = List(users).filter(user => user.op == true).sortBy(user => user.nick);
    const normal = List(users).filter(user => user.op != true).sortBy(user => user.nick);

    return ops.concat(normal);
}

export default function(state = defaultState, action) {
    switch (action.type) {
    	case INIT_CONNECTION:
    		return {
                ...state,
                io: action.payload
            }

    		break;
        case SET_CONNECTED: 
            return {
                ...state,
                connected: action.payload
            }

            break;
        case SET_CURRENT_NICK:
            return {
                ...state,
                nick: action.payload
            }    

            break;    
        case RECEIVE_MESSAGE:
            return {
                ...state,
                messages: state.messages.push({
                    message: action.payload,
                    timestamp: moment().valueOf()
                })
            }
            break;
        case JOIN_CHANNEL:
            var channels = state.channels;
            var channel = channelStructure();

            if (!channels.has(action.payload)) {
                channel.name = action.payload;
            }
           
            return {
                ...state,
                channels: channels.set(action.payload, channel),
                activeChannel: action.payload,
                messages: List(),
                users: List(),
                topic: state.topic
            }

            break;
        case PART_CHANNEL:
            var channels = state.channels;
            var channel = action.payload;
            var activeChannel = null;
            var topic = null;
            var users = List();
            var messages = List();

            channels = channels.remove(channel);

            if (channels.count() > 0) {
                var lastChannel = channels.last();
                activeChannel = lastChannel.name;
                messages = lastChannel.messages;
                users = lastChannel.users;
                topic = lastChannel.topic;
            }

            return {
                ...state,
                channels: channels.remove(channel),
                activeChannel: activeChannel,
                messages: messages,
                users: users,
                topic: topic
            }

            break;
        case USER_JOINS_CHANNEL: 
            var channels = state.channels;
            var channel = channels.get(action.payload.channelName);
            var user = action.payload.user;
            var users = sortUsers(channel.users.push(user).toArray());

            channel.users = users;

            return {
                ...state,
                channels: channels.set(channel.name, channel),
                users: users
            }

            break; 
        case USER_PARTS_CHANNEL:
            var channels = state.channels;
            var channel = channels.get(action.payload.channelName);

            channel.users = channel.users.filter(user => user.nick != action.payload.nick);

            return {
                ...state,
                channels: channels.set(action.payload.channelName, channel),
                users: channel.users
            }

            break;
        case SET_CHANNEL_TOPIC: 
            var channels = state.channels;
            var channel = channels.get(action.payload.channelName);
            channel.topic = action.payload.topic;

            return {
                ...state,
                channels: channels.set(action.payload.channelName, channel),
                topic: action.payload.channelName == state.activeChannel ? action.payload.topic : state.topic
            }
            break;
        case SET_CHANNEL_USERS: 
            var channel = null;
            var channels = state.channels;

            var users = sortUsers(action.payload.users);
            channel = channels.get(action.payload.channel)
            channel.users = users;
            channels = channels.set(action.payload.channel, channel);

            return {
                ...state,
                channels: channels,
                users: users
            }
            break; 
        case SET_CURRENT_CHANNEL:
            var channel = state.channels.get(action.payload);
            console.log("SET_CURRENT_CHANNEL: " + action.payload + ", " + JSON.stringify(channel))

            return {
                ...state,
                activeChannel: channel.name,
                messages: channel.messages,
                users: channel.users,
                topic: channel.topic
            }
            break;
        case MESSAGE_TO_CHANNEL:
            let userMessage = action.payload;

            var channel = state.channels.get(userMessage.receiver);
            var messages = state.messages;
            var newMessage = {
                message: userMessage.message,
                timestamp: moment().valueOf(),
                sender: userMessage.sender,
                me: userMessage.me != null && userMessage.me == true,
                channelName: channel.name
            };

            channel.messages = channel.messages.push(newMessage);

            if (channel.name == state.activeChannel) {
                messages = channel.messages;
            }

            return {
                ...state,
                channels: state.channels.set(channel.name, channel),
                messages: messages
            }
            break;
        case NEW_MESSAGE_RECEIVED:
            console.log("NEW_MESSAGE_RECEIVED: " + action.payload);
            
            return {
                ...state,
                newMessageOwner: action.payload
            }
            break;
        default:
            return state;
    }
};
