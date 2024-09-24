import * as anchor from "@coral-xyz/anchor";

import { utf8 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { Program, web3 } from "@coral-xyz/anchor";
import { UdfSolana } from "../target/types/udf_solana";
import { PhotonMock } from "../target/types/photon_mock";


module.exports = async function (provider) {
    // Configure client to use the provider.

    anchor.setProvider(provider);
    process.chdir("..");
    const udf_program = anchor.workspace.UdfSolana as Program<UdfSolana>;
    const ccm_program = anchor.workspace.PhotonMock as Program<PhotonMock>;

    const UDF_ROOT = utf8.encode("UDF0");
    const udfConfig = web3.PublicKey.findProgramAddressSync(
        [UDF_ROOT, utf8.encode("CONFIG")],
        udf_program.programId
    )[0];


    console.log("Owner", provider.wallet.payer.publicKey.toBase58());
    console.log("Config", udfConfig.toBase58());
    let UDF_PROTOCOL_ID = Buffer.from(
        utf8.encode(
            //"universal-data-feeds3\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00"
            "universal-data-feeds\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00"
        )
    );

    const tx = await udf_program.methods.initialize(Array.from(UDF_PROTOCOL_ID))
        .accounts({
            admin: provider.wallet.payer.publicKey,
            config: udfConfig,
            endpoint: ccm_program.programId,
            systemProgram: web3.SystemProgram.programId
        })
        .signers([provider.wallet.payer]).rpc({ commitment: "processed" });

    console.log("initialize transaction signature", tx);
};


