import React from 'react';
import {Button} from 'react-bootstrap';
import ButtonPanel from './ButtonPanel';
import UserPanel from './UserPanel';
import Window from './Window';
import InputPanel from './InputPanel';

const IndexPage = props => {

	const {connectToIrc, sendMessage, messages} = props;

    return (	
        <div className="component">
            <Button onClick={connectToIrc}>Connect</Button>
        	<Window messages={messages} />
        	<InputPanel onSendMessage={sendMessage}/>
            <UserPanel />

            <ButtonPanel />
        </div>
    );
};

export default IndexPage;
