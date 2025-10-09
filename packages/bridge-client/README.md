# TdeA Bridge Client SDK

El SDK de TdeA Bridge Client permite que las aplicaciones descentralizadas (dApps) se conecten e interactúen de forma segura con la TdeA Wallet. Este paquete gestiona la complejidad de la comunicación cifrada de extremo a extremo, permitiendo a los desarrolladores centrarse en la lógica de su aplicación.

## Características

-   **Conexión Segura:** Establece un canal de comunicación cifrado (AES-GCM-256) utilizando un intercambio de claves ECDH (X25519).
-   **Pairing con Código QR:** Genera URIs de conexión para mostrar como códigos QR, facilitando el emparejamiento con la billetera móvil.
-   **API Simple:** Proporciona una API sencilla y basada en promesas para solicitar cuentas, firmar transacciones y más.
-   **Protocolo JSON-RPC:** Se comunica sobre un protocolo JSON-RPC estándar a través de WebSockets.

## Instalación

```bash
npm install @tdea/bridge-client algosdk
```

## Guía de Inicio Rápido

A continuación se muestra un ejemplo completo de cómo conectar una dApp a la TdeA Wallet y solicitar la firma de una transacción.

### 1. Inicializar el Cliente

Primero, importa e instancia el `BridgeClient`. Puedes proporcionar metadatos sobre tu dApp que se mostrarán al usuario durante la conexión.

```javascript
import { BridgeClient } from '@tdea/bridge-client';
import algosdk from 'algosdk';

const dAppMetadata = {
  name: 'Mi dApp Asombrosa',
  url: 'https://mi-dapp.com',
  icon: 'https://mi-dapp.com/logo.png', // URL a un ícono
};

const bridge = new BridgeClient(dAppMetadata);

// Opcional: Escuchar eventos del ciclo de vida
bridge.on('uri_generated', (uri) => {
  console.log('URI de conexión lista. Muestra esto como un QR code:', uri);
  // Aquí es donde renderizarías el QR code en tu UI
  // Ejemplo: renderQRCode(uri);
});

bridge.on('session_established', (sessionData) => {
  console.log('¡Conexión establecida con la billetera!', sessionData);
});

bridge.on('session_disconnected', () => {
  console.log('La sesión ha sido desconectada.');
});
```

### 2. Iniciar la Conexión

Llama a `connect()` para generar una nueva sesión y obtener la URI para el código QR.

```javascript
async function iniciarConexion() {
  try {
    // Genera una nueva sesión y la URI para el QR code
    const { uri } = await bridge.connect();
    
    // Muestra el QR code en tu UI usando la `uri`
    document.getElementById('qr-code-container').innerHTML = `<qr-code value="${uri}"></qr-code>`;

  } catch (error) {
    console.error('Error al iniciar la conexión:', error);
  }
}

iniciarConexion();
```

### 3. Solicitar Cuentas

Una vez que la sesión está establecida, puedes solicitar las direcciones de billetera del usuario.

```javascript
async function obtenerCuentas() {
  if (!bridge.isConnected) {
    alert('Primero debes conectar la billetera.');
    return;
  }

  try {
    const { accounts } = await bridge.requestAccounts();
    console.log('Cuentas del usuario:', accounts);
    // Guarda la dirección del usuario para usarla después
    const userAddress = accounts[0];
  } catch (error) {
    console.error('El usuario rechazó la solicitud o hubo un error:', error);
  }
}
```

### 4. Solicitar la Firma de una Transacción

Para solicitar una firma, primero crea una transacción sin firmar usando el SDK de Algorand. Luego, codifícala en Base64 y envíala a la billetera.

```javascript
async function firmarYEnviar() {
  if (!bridge.isConnected || !userAddress) {
    alert('Conecta la billetera y obtén la dirección primero.');
    return;
  }

  // 1. Configurar cliente de Algorand y obtener parámetros
  const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '');
  const suggestedParams = await algodClient.getTransactionParams().do();

  // 2. Crear la transacción sin firmar
  const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: userAddress,
    to: 'HZ57J3K46JIJX37XBUDXF54FF5253F5I2PE6DIH3Q4AF2P2T6NL42X2UBA', // Dirección de ejemplo
    amount: 100000, // 0.1 ALGO
    suggestedParams,
    note: new Uint8Array(Buffer.from('Envío desde Mi dApp Asombrosa')),
  });

  // 3. Codificar la transacción en Base64
  const txnsToSign = [Buffer.from(algosdk.encodeUnsignedTransaction(txn)).toString('base64')];

  try {
    // 4. Enviar la transacción a la billetera para ser firmada
    const { signedTxns } = await bridge.signTransactions(txnsToSign);

    // 5. Decodificar la transacción firmada y enviarla a la red
    const signedTxnBlob = Buffer.from(signedTxns[0], 'base64');
    const { txId } = await algodClient.sendRawTransaction(signedTxnBlob).do();
    
    console.log(`¡Transacción enviada con éxito! ID: ${txId}`);
    alert(`Transacción enviada: ${txId}`);

  } catch (error) {
    console.error('El usuario canceló la firma o hubo un error:', error);
  }
}
```

## Referencia de la API `BridgeClient`

### Constructor

`new BridgeClient(metadata: DAppMetadata, relayUrl?: string)`

-   `metadata`: Objeto con `name`, `url` (opcional), y `icon` (opcional) de tu dApp.
-   `relayUrl`: (Opcional) URL del servidor de relay WebSocket. Por defecto usa el relay público de TdeA.

### Eventos

-   `on(event: 'uri_generated', listener: (uri: string) => void)`
-   `on(event: 'session_established', listener: (data: any) => void)`
-   `on(event: 'session_disconnected', listener: () => void)`

### Propiedades

-   `isConnected: boolean`: Devuelve `true` si hay una sesión cifrada activa.

### Métodos

-   `connect(): Promise<{ uri: string }>`: Inicia una nueva sesión de emparejamiento.
-   `disconnect(): void`: Cierra la sesión actual.
-   `requestAccounts(): Promise<{ accounts: string[] }>`: Solicita las direcciones de billetera del usuario.
-   `signTransactions(txns: string[]): Promise<{ signedTxns: string[] }>`: Solicita al usuario que firme un array de transacciones (codificadas en base64).
