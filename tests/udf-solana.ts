import * as anchor from "@coral-xyz/anchor";
import { UdfSolana } from "../target/types/udf_solana";
import { PhotonMock } from "../target/types/photon_mock";
import { PriceConsumer } from "../target/types/price_consumer";
import { PriceConsumerPull } from "../target/types/price_consumer_pull";
import { utf8 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { Program, web3 } from "@coral-xyz/anchor";

import { fetchPriceFeed } from "./util"
import BN from "bn.js";
import { base64 } from "ethers/lib/utils";
import * as assert from "node:assert";

const UDF_PROTOCOL_ID = Buffer.from(
    utf8.encode(
        "universal-data-feeds3\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00"
    )
);
const GOV_PROTOCOL_ID = Buffer.from(
    utf8.encode(
        "photon-gov\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00"
    )
);
const UDF_ROOT = utf8.encode("UDF0");
const PHOTON_ROOT = utf8.encode("r0");
const CONSUMER_POOL_ROOT = utf8.encode("CONSUMER_PULL");

const FinalizedSnapUrl = "https://pricefeed.entangle.fi";
const FinalizedSourceID = "prices-feed1";

type MultipleUpdateData = anchor.IdlTypes<UdfSolana>["MultipleUpdateMessage"];
type LastPriceData = anchor.IdlTypes<UdfSolana>["LastPriceMessage"];
type DataFeed = anchor.IdlTypes<UdfSolana>["DataFeed"];


describe("udf-solana", () => {

    anchor.setProvider(anchor.AnchorProvider.env());
    const udf_program = anchor.workspace.UdfSolana as Program<UdfSolana>;
    const ccm_program = anchor.workspace.PhotonMock as Program<PhotonMock>;
    const consumer_program = anchor.workspace.PriceConsumer as Program<PriceConsumer>;
    const consumer_pull_program = anchor.workspace.PriceConsumerPull as Program<PriceConsumerPull>

    const govExecutor = anchor.web3.Keypair.fromSecretKey(Uint8Array.from(require("../keys/gov-executor.json")));
    const owner = anchor.web3.Keypair.fromSecretKey(Uint8Array.from(require("../keys/owner.json")));
    const publisher = anchor.web3.Keypair.fromSecretKey(Uint8Array.from(require("../keys/publisher.json")));

    let transmitters = [];
    let udfConfig = null;
    let udfProtocolInfo = null;
    let photonGovProtocolInfo = null;
    let photonConfig = null;

    before(async () => {
        await udf_program.provider.connection.requestAirdrop(
            publisher.publicKey,
            5 * anchor.web3.LAMPORTS_PER_SOL
        );

        await udf_program.provider.connection.requestAirdrop(
            govExecutor.publicKey,
            5 * anchor.web3.LAMPORTS_PER_SOL
        );

        udfConfig = web3.PublicKey.findProgramAddressSync(
            [UDF_ROOT, utf8.encode("CONFIG")],
            udf_program.programId
        )[0];

        udfProtocolInfo = web3.PublicKey.findProgramAddressSync(
            [PHOTON_ROOT, utf8.encode("PROTOCOL"),
                UDF_PROTOCOL_ID], ccm_program.programId
        )[0];

        console.log("Udf protocol info", udfProtocolInfo.toBase58())
        photonGovProtocolInfo = web3.PublicKey.findProgramAddressSync(
            [PHOTON_ROOT, utf8.encode("PROTOCOL"), GOV_PROTOCOL_ID],
            ccm_program.programId
        )[0];

        photonConfig = web3.PublicKey.findProgramAddressSync(
            [PHOTON_ROOT, utf8.encode("CONFIG")],
            ccm_program.programId
        )[0];

    });

    it("Initialize photon mock", async () => {

        let transmitters = [
            Array.from(Buffer.from("EfCF6f62254F76d9eF9bc06C843EAc97F0aA1723", "hex")),
            Array.from(Buffer.from("E8a5D7DE6c51ae39326f93180F610F5cb8f0B4CC", "hex")),
            Array.from(Buffer.from("BC506a4af4d452c2908CE6c590028EFD8EEC7962", "hex"))
        ];

        const tx = await ccm_program.methods.initialize(transmitters)
            .accounts({
                admin: owner.publicKey,
                protocolInfo: udfProtocolInfo,
                systemProgram: web3.SystemProgram.programId
            })
            .signers([owner]).rpc();

        console.log("initialize transaction signature", tx);
    });

    it("Initialize price oracle", async () => {
        console.log("Owner", owner.publicKey.toBase58());
        console.log("Config", udfConfig.toBase58());

        const tx = await udf_program.methods.initialize(UDF_PROTOCOL_ID)
            .accounts({
                admin: owner.publicKey,
                config: udfConfig,
                endpoint: ccm_program.programId,
                systemProgram: web3.SystemProgram.programId
            })
            .signers([owner]).rpc();

        console.log("initialize transaction signature", tx);
    });

    it("Update single price", async () => {
        let utf8Encode = new TextEncoder();

        const dataKey = new Uint8Array(32);
        dataKey.set(utf8Encode.encode("NGL/USD"));

        let latestUpdatePda = web3.PublicKey.findProgramAddressSync(
            [UDF_ROOT, utf8.encode("LAST_UPDATE"), UDF_PROTOCOL_ID, dataKey],
            udf_program.programId
        )[0];
        console.log("Data feed pda", latestUpdatePda.toBase58());

        const data = Array.from(Buffer.from("00000000000000000000000000000000000000000000000002b6498fc05aba1b", "hex"));
        const timestamp = new anchor.BN(1721838418);
        let dataFeed: DataFeed = {
            timestamp: timestamp,
            dataKey: Array.from(dataKey),
            data: data,
            merkleProof: [
                Array.from(Buffer.from("d9c4cda803450076940306457745ed3ab6f4875f4e5086931f21a9c2da8d64f9", "hex")),
                Array.from(Buffer.from("2754d47eba0af64135b87baa5a6e6324aa020f58196264145e613aa2f78bf926", "hex"))
            ],
        };
        let dataFeedMessage: MultipleUpdateData = {
            dataFeeds: [dataFeed],
            signatures: [{
                v: 28,
                r: Buffer.from("d92028d242d7b7b054bfa9b5a9f336d4352b5b1da3cafd71288c14b3f9ae722c", "hex"),
                s: Buffer.from("6053b190e6f39c7b08cc37b68ac1d8ecd9ab735cdade4cc898724760777da98a", "hex"),
            }, {
                v: 28,
                r: Buffer.from("ba6b24be0611a4796873c47723f56928c7fc71edfab9862e2a7511a72b5426a0", "hex"),
                s: Buffer.from("26c22606b533b645e9cb74b25d8e081e985727e739b1c643e1959c8000c4c9a0", "hex"),
            }, {
                v: 28,
                r: Buffer.from("b40e33efefeff5901b5ef7f94762cfb805ba3cfdeaae3c09517d7c3160d187ed", "hex"),
                s: Buffer.from("4ad1df603b191603234faca397ac2148805bd86ec7c8d0f093c516a455a7bcf3", "hex"),
            }],
            merkleRoot: Array.from(Buffer.from("07963960682c8bf05845f099078d6839bf6f6d6d159f36adc32dcff465c71b56", "hex"))
        }

        const computeBudgetIx = web3.ComputeBudgetProgram.setComputeUnitLimit({ units: 400000 });
        let tx = new web3.Transaction();
        tx.add(computeBudgetIx);

        const udfIx = await udf_program.methods.updateMultipleAssets(dataFeedMessage)
            .accounts({
                publisher: publisher.publicKey,
                config: udfConfig,
                protocolInfo: udfProtocolInfo,
                systemProgram: web3.SystemProgram.programId
            })
            .remainingAccounts([{ pubkey: latestUpdatePda, isSigner: false, isWritable: true }])
            .signers([publisher]).instruction();
        tx.add(udfIx);

        const signature = await udf_program.provider.sendAndConfirm(tx, [publisher]);
        console.log("Update single price transaction signature", signature);

        const latestUpdate = await udf_program.account.latestUpdate.fetch(latestUpdatePda);
        assert.deepEqual(latestUpdate.dataKey, Array.from(dataKey));
        assert.deepEqual(latestUpdate.data, data);
        assert.ok(latestUpdate.dataTimestamp.eq(timestamp));
    });


    it("Update multiple price", async () => {
        let utf8Encode = new TextEncoder();
        const timestamp1 = new anchor.BN(1721923139);
        const data1 = Array.from(Buffer.from("000000000000000000000000000000000000000000000000028268a1669ac38f", "hex"));
        const dataKey1 = new Uint8Array(32);
        dataKey1.set(utf8Encode.encode("NGL/USD"));
        let dataFeed1: DataFeed = {
            timestamp: timestamp1,
            dataKey: Array.from(dataKey1),
            data: data1,
            merkleProof: [
                Array.from(Buffer.from("6ef0fc20a41e66fbab7d2af53d4a22e1e302a26039a17bc3831b04267fdb371d", "hex")),
                Array.from(Buffer.from("90947a64a3f0b578c35a66c8426e858fdc23eb89e7c0c82de9c7aaec66a47128", "hex"))
            ],
        };
        let latestUpdatePda1 = web3.PublicKey.findProgramAddressSync(
            [UDF_ROOT, utf8.encode("LAST_UPDATE"), UDF_PROTOCOL_ID, dataKey1],
            udf_program.programId
        )[0];
        console.log("latest update 1 pda:", latestUpdatePda1.toBase58());

        const timestamp2 = new anchor.BN(1721923123);
        const data2 = Array.from(Buffer.from("0000000000000000000000000000000000000000000000aa03dc9c5b16eaa131", "hex"));
        const dataKey2 = new Uint8Array(32);
        dataKey2.set(utf8Encode.encode("ETH/USD"));
        let dataFeed2: DataFeed = {
            timestamp: timestamp2,
            dataKey: Array.from(dataKey2),
            data: data2,
            merkleProof: [
                Array.from(Buffer.from("902a6fa791e8592fa16204552aabfbc857b627bb4c9656c109223867ac7a32b2", "hex")),
                Array.from(Buffer.from("0a8b2f28a2860cc023c5e8a4b71e695f9f4c79d5acbdba882aece6ec59b8d820", "hex"))
            ],
        };
        let latestUpdatePda2 = web3.PublicKey.findProgramAddressSync(
            [UDF_ROOT, utf8.encode("LAST_UPDATE"), UDF_PROTOCOL_ID, dataKey2],
            udf_program.programId
        )[0];
        console.log("latest update 2 pda:", latestUpdatePda2.toBase58());

        const timestamp3 = new anchor.BN(1721923134);
        const data3 = Array.from(Buffer.from("000000000000000000000000000000000000000000000db1bc1db5c37d9b53a2", "hex"));
        const dataKey3 = new Uint8Array(32);
        dataKey3.set(utf8Encode.encode("BTC/USD"));
        let dataFeed3: DataFeed = {
            timestamp: timestamp3,
            dataKey: Array.from(dataKey3),
            data: data3,
            merkleProof: [
                Array.from(Buffer.from("69ca37b692f2ba7d5058b91902ebd1513e327f6204f5f978209d40b9f640e09d", "hex")),
                Array.from(Buffer.from("90947a64a3f0b578c35a66c8426e858fdc23eb89e7c0c82de9c7aaec66a47128", "hex"))
            ],
        };
        let latestUpdatePda3 = web3.PublicKey.findProgramAddressSync(
            [UDF_ROOT, utf8.encode("LAST_UPDATE"), UDF_PROTOCOL_ID, dataKey3],
            udf_program.programId
        )[0];
        console.log("latest update 3 pda:", latestUpdatePda3.toBase58());

        let dataFeedMessage: MultipleUpdateData = {
            dataFeeds: [dataFeed1, dataFeed2, dataFeed3],
            signatures: [{
                v: 27,
                r: Buffer.from("44f767f8eea7c3b4acd906e447bcd4d94698911f420b3ba57691b9d522b164f0", "hex"),
                s: Buffer.from("0683edfe7e5a2dbeaf9c1b2175e4ea4a893b3bec6fe9ef52740ec1ea1b477919", "hex"),
            }, {
                v: 28,
                r: Buffer.from("6eb42f6d0bae9e6b5e09d3993e8ef81dc853cab4cd5a9afae250bd19b250d88e", "hex"),
                s: Buffer.from("7c24f6103377f8d9fe10dc5d44df0e0f1824411dba201ee93211c910e1187b48", "hex"),
            }, {
                v: 28,
                r: Buffer.from("6a73a4afa7a5d6d8575f3deda96a1dac17f09124284fcb1baaf6bd0b5041c90e", "hex"),
                s: Buffer.from("5500b1b6bf41027dfbce4e787d11ac3407cefbd9e29338b3aa29797bc6bfeab8", "hex"),
            }],
            merkleRoot: Array.from(Buffer.from("b3dcf4e5fa1d50eda24c8fd2e35ec9fd2be13a4829bf2d41a240c96b28e1fece", "hex"))
        }

        const computeBudgetIx = web3.ComputeBudgetProgram.setComputeUnitLimit({ units: 400000 });
        let tx = new web3.Transaction();
        tx.add(computeBudgetIx);

        const udfIx = await udf_program.methods.updateMultipleAssets(dataFeedMessage)
            .accounts({
                publisher: publisher.publicKey,
                config: udfConfig,
                protocolInfo: udfProtocolInfo,
                systemProgram: web3.SystemProgram.programId
            })
            .remainingAccounts([
                { pubkey: latestUpdatePda1, isSigner: false, isWritable: true },
                { pubkey: latestUpdatePda2, isSigner: false, isWritable: true },
                { pubkey: latestUpdatePda3, isSigner: false, isWritable: true }
            ])
            .signers([publisher]).instruction();
        tx.add(udfIx);

        const signature = await udf_program.provider.sendAndConfirm(tx, [publisher]);
        console.log("Update multiple price transaction signature", signature);

        const latestUpdate = await udf_program.account.latestUpdate.fetch(latestUpdatePda1);
        assert.deepEqual(latestUpdate.dataKey, Array.from(dataKey1));
        assert.deepEqual(latestUpdate.data, data1);
        assert.ok(latestUpdate.dataTimestamp.eq(timestamp1));
    });

    it.skip("Fetch data feed and verify it through the pull consumer", async () => {
        const asset = "BTC/USD";
        const url = new URL(`${FinalizedSnapUrl}/spotters/${FinalizedSourceID}`);
        url.searchParams.append('assets', asset);

        // Make the request to finalized-data-snap
        const updateRes = await fetchPriceFeed(url.toString());
        if (updateRes.calldata.feeds.length === 0) {
            throw new Error('No feeds found');
        }

        let origin_feed = updateRes.calldata.feeds[0];
        let utf8Encode = new TextEncoder();
        const dataKey1 = new Uint8Array(32);
        dataKey1.set(utf8Encode.encode(origin_feed.key));

        let timestamp = new anchor.BN(origin_feed.value.timestamp);
        let dataFeed1: DataFeed = {
            timestamp: timestamp,
            dataKey: Array.from(dataKey1),
            data: Array.from(origin_feed.value.data),
            merkleProof: origin_feed.merkleProofs.map(proof => {
                return Array.from(Buffer.from(proof, 'base64'));
            })
        };

        let signatures = updateRes.calldata.signatures.map(signature => {
            return {
                v: signature.V,
                r: Buffer.from(signature.R.substring(2), "hex"),
                s: Buffer.from(signature.S.substring(2), "hex")
            };
        });

        let merkleRoot = Array.from(Buffer.from(updateRes.calldata.merkleRoot.substring(2), "hex"));
        let lastPriceData: LastPriceData = {
            dataFeed: dataFeed1,
            signatures: signatures,
            merkleRoot: merkleRoot
        }

        const computeBudgetIx = web3.ComputeBudgetProgram.setComputeUnitLimit({ units: 400000 });
        let verifyPriceTx = new web3.Transaction();
        verifyPriceTx.add(computeBudgetIx);

        let latestUpdatePda = web3.PublicKey.findProgramAddressSync(
            [UDF_ROOT, utf8.encode("LAST_UPDATE"), UDF_PROTOCOL_ID, dataKey1],
            udf_program.programId
        )[0];
        console.log("publisher:", publisher.publicKey.toBase58())
        console.log("price oracle:", udf_program.programId.toBase58())
        console.log("config: ", udfConfig.toBase58())
        console.log("protocol info: ", udfProtocolInfo.toBase58())
        console.log("latest update: ", latestUpdatePda.toBase58())

        const verifyPriceIx = await consumer_pull_program.methods.verifyPrice(lastPriceData)
            .accounts({
                    publisher: publisher.publicKey,
                    priceOracle: udf_program.programId,
                    config: udfConfig,
                    protocolInfo: udfProtocolInfo,
                    latestUpdate: latestUpdatePda,
                    systemProgram: web3.SystemProgram.programId
                }
            )
            .signers([publisher]).instruction();
        verifyPriceTx.add(verifyPriceIx);
        const signature = await consumer_pull_program.provider.sendAndConfirm(verifyPriceTx, [publisher], { skipPreflight: false });

        console.log("Verify price transaction signature", signature);

        const result = await consumer_pull_program.provider.simulate(verifyPriceTx)
        const resultNum = new BN(base64.decode(result.returnData.data[0]), 10, "be");
        const divisor = new BN("1000000000000000000", 10);
        const int = parseFloat(resultNum.div(divisor).toString())
        const reminder = parseFloat(resultNum.mod(divisor).toString(10)) / parseFloat(divisor.toString(10));
        console.log("Last ", origin_feed.key, " price is:", int + reminder)
        const latestUpdate = await udf_program.account.latestUpdate.fetch(latestUpdatePda);
        assert.deepEqual(latestUpdate.dataKey, Array.from(dataKey1));
        assert.deepEqual(latestUpdate.data, Array.from(origin_feed.value.data));
        assert.ok(latestUpdate.dataTimestamp.eq(timestamp));
    })


    it("Verify price through the pull consumer", async () => {
        let utf8Encode = new TextEncoder();

        const dataKey = new Uint8Array(32);
        dataKey.set(utf8Encode.encode("NGL/USD"));

        let latestUpdatePda = web3.PublicKey.findProgramAddressSync(
            [UDF_ROOT, utf8.encode("LAST_UPDATE"), UDF_PROTOCOL_ID, dataKey],
            udf_program.programId
        )[0];
        console.log("Data feed pda", latestUpdatePda.toBase58());

        const data = Array.from(Buffer.from("00000000000000000000000000000000000000000000000001cd7dccedfae367", "hex"));
        const timestamp = new anchor.BN(1723502724);
        let dataFeed: DataFeed = {
            timestamp: timestamp,
            dataKey: Array.from(dataKey),
            data: data,
            merkleProof: [
                Array.from(Buffer.from("387d19e56e66e06b0b7209189a1a66dfbb2b87a4fe56f9cb9f6e4b813a01e821", "hex")),
                Array.from(Buffer.from("f839cf170d834cb6312691d75ce378149a2b9a0b9d7a5c7c07c3ca6a66286b4b", "hex"))
            ],
        };
        let lastPriceData: LastPriceData = {
            dataFeed: dataFeed,
            signatures: [{
                v: 28,
                r: Buffer.from("5116c928d3a13a47d2f1c055e57564280f2f455a433d9360292bd8a57f428155", "hex"),
                s: Buffer.from("13df35b89f982306fc42f4e2f074880bc7b5e9d2df6febc6bd7e38e3f8d1b831", "hex"),
            }, {
                v: 28,
                r: Buffer.from("0d09f78606915f60531f3a45b1bb62b75755254eedb58291d4a7805248f2e723", "hex"),
                s: Buffer.from("0cccc0bed37328faa9e6e0a35a63164ef248c785fb58595fe629cac54b1ab08c", "hex"),
            }, {
                v: 27,
                r: Buffer.from("025aa961b80bdec312a87d48c9e084bb5427316c7b0cbd7c79f8fc9f75aced82", "hex"),
                s: Buffer.from("029a25af80fff863a390bcbc967e2e8b17d0aa6da90098577192a3ed4e767d1d", "hex"),
            }],
            merkleRoot: Array.from(Buffer.from("9572fbbba8b66755f38c81e65ae0d13b087f31d86d5e746ca17e27bf2da38d06", "hex"))
        }

        const computeBudgetIx = web3.ComputeBudgetProgram.setComputeUnitLimit({ units: 400000 });
        let verifyPriceTx = new web3.Transaction();
        verifyPriceTx.add(computeBudgetIx);
        // console.log("publisher:", publisher.publicKey.toBase58())
        // console.log("price oracle:", udf_program.programId.toBase58())
        // console.log("protocol info: ", udfProtocolInfo.toBase58())
        const verifyPriceIx = await consumer_pull_program.methods.verifyPrice(lastPriceData)
            .accounts({
                    publisher: publisher.publicKey,
                    priceOracle: udf_program.programId,
                    config: udfConfig,
                    protocolInfo: udfProtocolInfo,
                    latestUpdate: latestUpdatePda,
                    systemProgram: web3.SystemProgram.programId
                }
            )
            .signers([publisher]).instruction();
        verifyPriceTx.add(verifyPriceIx);

        const signature = await consumer_pull_program.provider.sendAndConfirm(verifyPriceTx, [publisher]);
        console.log("Verify price transaction signature", signature);

        const result = await consumer_pull_program.provider.simulate(verifyPriceTx)
        const resultNum = new BN(base64.decode(result.returnData.data[0]), 10, "be");
        const divisor = new BN("1000000000000000000", 10);
        const int = parseFloat(resultNum.div(divisor).toString())
        const reminder = parseFloat(resultNum.mod(divisor).toString(10)) / parseFloat(divisor.toString(10));
        console.log("Last NGL/USDT price is:", int + reminder)
        const latestUpdate = await udf_program.account.latestUpdate.fetch(latestUpdatePda);
        assert.deepEqual(latestUpdate.dataKey, Array.from(dataKey));
        assert.deepEqual(latestUpdate.data, data);
        assert.ok(latestUpdate.dataTimestamp.eq(timestamp));
    });

    it("Consume price", async () => {
        let utf8Encode = new TextEncoder();

        const dataKey = new Uint8Array(32);
        dataKey.set(utf8Encode.encode("NGL/USD"));
        const udf_program_id = new web3.PublicKey("7HramSnctpbXqZ4SEzqvqteZdMdj3tEB2c9NT7egPQi7");
        let latestUpdatePda = web3.PublicKey.findProgramAddressSync(
            [UDF_ROOT, utf8.encode("LAST_UPDATE"), UDF_PROTOCOL_ID, dataKey],
            udf_program_id
        )[0];
        const getLastPriceTx = await consumer_program.methods.consumePrice(dataKey)
            .accounts({
                signer: owner.publicKey,
                priceOracle: udf_program_id,
                latestUpdate: latestUpdatePda,
            })
            .signers([owner])
            .rpc();
        console.log("Consume tx signature", getLastPriceTx);
    })
});

