import { beginCell, toNano } from '@ton/core';
import { HighloadWalletV3 } from '../wrappers/HighloadWalletV3';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const address = provider.sender().address;

    if (!address) {
        throw new Error('No address');
    }

    const pub = await provider.provider(address).get('get_public_key', []);
    const publicKeyUInt = pub.stack.readBigNumber();
    const publicKey = publicKeyUInt.toString(16);

    let timeout = await (async () => {
        while (true) {
            const timeout = await provider.ui().input('Select timeout in seconds, default one hour: 3600');

            if (!timeout) {
                return 3600;
            }

            const num = parseInt(timeout, 10);
            if (isNaN(num)) {
                provider.ui().write('Invalid number');
                continue;
            }

            return num;
        }
    })();

    const highloadWalletV3 = provider.open(
        HighloadWalletV3.createFromConfig(
            {
                publicKey: Buffer.from(publicKey, 'hex'),
                subwalletId: 0x10ad,
                timeout: timeout,
            },
            await compile('HighloadWalletV3'),
        ),
    );

    await highloadWalletV3.sendDeploy(provider.sender(), toNano('0.1'));

    await provider.waitForDeploy(highloadWalletV3.address, 10, 5);
}
