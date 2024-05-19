import { beginCell, toNano, Cell } from '@ton/core';
import { keyPairFromSeed, mnemonicToSeed, getSecureRandomBytes } from '@ton/crypto';
import { HighloadWalletV3 } from '../wrappers/HighloadWalletV3';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const seed = await getSecureRandomBytes(32);
    const keyPair = await keyPairFromSeed(seed);

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
                publicKey: keyPair.publicKey,
                subwalletId: 0x10ad,
                timeout: timeout,
            },
            await compile('HighloadWalletV3'),
        ),
    );

    await highloadWalletV3.sendDeploy(provider.sender(), toNano('0.1'));

    provider.ui().write('Deployed HighloadWalletV3');
    provider.ui().write(`Seed: ${seed.toString('hex')}`);
    provider.ui().write(`Public key: ${keyPair.publicKey.toString('hex')}`);
    provider.ui().write(`Address: ${highloadWalletV3.address}`);

    await provider.waitForDeploy(highloadWalletV3.address, 10, 5);
}
