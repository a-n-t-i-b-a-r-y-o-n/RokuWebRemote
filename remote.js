
ROKU_IP = '';
ROKU_PORT = '8060';


HA_HOST = ''
HA_PORT = ''
HA_API_KEY = '';

async function keypress(key) {
	const response = await fetch(`http://${ROKU_IP}:${ROKU_PORT}/keypress/${key}`, {
		method: 'POST',
		mode: 'no-cors',
		cache: 'no-cache',
		credentials: 'omit',
		headers: {
			// Seems to fail without this - the doc demos `curl` w/ default headers. *shrug*
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		body: ''
	});
}


async function launch(id) {
	const response = await fetch(`http://${ROKU_IP}:${ROKU_PORT}/launch/${id}`, {
		method: 'POST',
		mode: 'no-cors',
		credentials: 'omit',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		body: ''
	});
}

async function getstate() {

	// Basic idea:  Try to get the device-info endpoint and parse the output for the "power-mode" key.
	// 				If the connection fails, then we know need to wake the device with Wake-on-LAN.

	try {

		/* Basic `fetch` with timeout
		 * Sources:
		 	- https://stackoverflow.com/questions/46946380/fetch-api-request-timeout/49857905)
		 	- https://dmitripavlutin.com/timeout-fetch-request/
		*/
		const controller = new AbortController();
		const signal = controller.signal;
		let request = await fetch(`http://${ROKU_IP}:${ROKU_PORT}/query/device-info`, {
			method: 'GET',
			mode: 'no-cors',
			credentials: 'omit',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			},
		});
		
		// Set timeout of 3s
		const timeout = setTimeout(() => controller.abort(), 3000);

		console.log(await request.text());

		await request.text().then(r => {
			console.log(r);
			clearTimeout(timeout);
		})
		.then(data => console.log(data));

	} catch (e) {
		// Fetch failed! The device is off and needs to be woken up with Wake-on-LAN
		return "Off";
	}

}

async function wake() {
	// This actually calls a HomeAssistant shell_command service to run the `wakeonlan` command
	await fetch(`https://${HA_HOST}:${HA_PORT}/api/services/shell_command/wake_roku_tv_ethernet`, {
		method: 'POST',
		credentials: 'omit',
		headers: {
			'Authorization': `Bearer ${HA_API_KEY}`,
			'Content-Type': 'application/json'
		},
		body: ''
	});
}

async function poweron() {
	// Use Wake-on-LAN if the device is off
	if(await getstate() == "Off"){
		wake();
	}
	else
		keypress('PowerOn');
}
