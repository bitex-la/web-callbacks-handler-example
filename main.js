const http = require('http')
const fs = require('graceful-fs')

const hostname = '0.0.0.0'
const port = 3000

const server = http.createServer((req, res) => {
  let body = '';
  req.on('data', (chunk) => {
      body += chunk;
  });
  req.on('end', () => {
    let json_event = JSON.parse(body);
    let event_type = json_event.data.attributes.event_type;

    fs.writeFileSync(`examples/${json_event.data.id}_${event_type}.json`,
      JSON.stringify(json_event, null, 2));

    /* Si quisiera ignorar un evento ya procesado lo puedo hacer acá. */

    let handler = Handlers[event_type];

    if(handler) {
      console.log(`Handling ${event_type}`);
      handler(json_event.data);
    }else{
      console.log(`Ignoring ${event_type}`);
    }

    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json')
    res.end('{"status":"success"}\n')
  });
})

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`)
})

const Handlers = {
  concierge_request_output_working: (ev) => {
    console.log(`Estamos procesando tu pago #${ev.relationships.resource.data.id}`);
    let failures = ev.relationships.failures.data.length;
    if(failures > 0){
      console.log(`Este pago ya fue intentado ${failures} veces`);
    }
  },
  concierge_request_output_settling: (ev) => {
    console.log(`Tu pago #${ev.relationships.resource.data.id} ya fue procesado, en 24 horas llega a destino.`);
  },
  concierge_request_output_settled: (ev) => {
    console.log(`Tu pago #${ev.relationships.resource.data.id} llegó a destino`);
  },
  concierge_request_output_failed: (ev) => {
    // Último motivo de falla. Cantidad de reintentos.
    console.log(`Tu pago #${ev.relationships.resource.data.id} tuvo un problema.
      Tenemos que contactarnos contigo para reintentarlo.`);
  },
  concierge_request_output_returned: (ev) => {
    // Último motivo de falla. Cantidad de reintentos.
    console.log(`Luego de varios intentos, tuvimos que devolver tu pago
      #${ev.relationships.resource.data.id}.
      Te reintegramos el monto menos costos y comisiones.`);
  },
  concierge_request_output_rejected: (ev) => {
    // Nombre del cobrador.
    console.log(`Lamentamos informarte que por decisión de la empresa
      no podemos pagar al destinatario del pago #${ev.relationships.resource.data.id}.
      Reintegramos el monto total a la cuenta de origen.
      En breve tendrás también la nota de crédito correspondiente.`);
  },
  concierge_request_cancelled: (ev) => {
    /* Motivos posibles: payment_not_received, quote_not_accepted, draft_was_pruned */
    console.log(`Tu pago ha sido cancelado.`);
  },
  user_disabled: (ev) => {
    console.log(`Necesitamos contactarnos contigo, antes de que continues
      utilizando el servicio. Tus pagos en curso continuarán una vez resuelta
      la situación.`);
  },
  concierge_request_receipt_created: (ev) => {
    // En este evento recibimos todo un Request
  },
  concierge_request_credit_note_created: (ev) => {
    // En este evento recibimos todo un Request
  },
  withdrawal_instruction_created: (ev) => {
    // En este evento recibimos uno withdrawal_instruction
  },
  withdrawal_instruction_updated: (ev) => {
    // En este evento recibimos uno withdrawal_instruction
  },
  withdrawal_instruction_destroyed: (ev) => {
    // En este evento recibimos uno withdrawal_instruction
  }
}

