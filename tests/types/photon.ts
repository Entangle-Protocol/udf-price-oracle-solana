export type Photon = {
  "version": "0.1.0",
  "name": "photon",
  "docs": [
    "The `photon` module encapsulates all operations related to cross-chain messaging on the Solana blockchain,",
    "leveraging the capabilities of the Photon cross-chain messaging layer. It defines the governance and",
    "operational structure necessary to initiate, approve, and execute operations across blockchains.",
    "",
    "## Constants",
    "- `SOLANA_CHAIN_ID`: Unique identifier for the Solana chain, used for validation.",
    "- `RATE_DECIMALS`: Used for calculations involving rate percentages in consensus processes.",
    "- `ROOT`: A byte string used as a base for seed generation in account addresses.",
    "- `MAX_TRANSMITTERS`, `MAX_EXECUTORS`, `MAX_PROPOSERS`: Define the maximum allowable numbers of transmitters,",
    "executors, and proposers respectively to ensure the system's scalability and manageability.",
    "",
    "## Key Operations",
    "- **Initialize**: Sets up the initial configuration for protocols, defining administrators, chain IDs,",
    "smart contracts, and operational parameters such as rate and role-based limitations.",
    "- **Load Operation**: The first step in operation execution, verifying the operation's integrity and",
    "preparing it for further processing by setting its initial state.",
    "- **Sign Operation**: Involves validating signatures to achieve consensus among transmitters, updating",
    "the operation status upon achieving the required threshold.",
    "- **Execute Operation**: The final step where the operation is executed based on the received and",
    "validated instructions, with potential cross-program invocations if the operation involves governance",
    "protocols.",
    "- **Propose**: Allows registered proposers to submit operations intended to be executed on other chains,",
    "managing these proposals through events that ensure transparency and traceability.",
    "- **Receive Photon Message**: Specialized in handling operations directed at the governance protocol,",
    "executing code-based operations that affect the system's governance structure.",
    "",
    "## Structs and Contexts",
    "- `Initialize`, `LoadOperation`, `SignOperation`, `ExecuteOperation`: Context structs designed to facilitate",
    "the respective operations by providing necessary accounts and permissions checks.",
    "- `Propose`, `ReceivePhotonMsg`: Handle specific scenarios where operations need to be proposed to other chains",
    "or where governance-related messages are processed.",
    "",
    "## Custom Errors",
    "A comprehensive set of custom errors (`CustomError`) enhances error handling by providing clear, contextual",
    "messages that aid in debugging and user feedback, covering a range of issues from permission errors to",
    "mismatches in operation data.",
    "",
    "## Usage",
    "This program is crucial for maintaining a robust and secure cross-chain communication infrastructure on Solana,",
    "supporting a wide range of decentralized applications that require interaction between different blockchains.",
    "It emphasizes security, scalability, and interoperability, ensuring that operations not only adhere to protocol",
    "requirements but also maintain integrity across executions.",
    "",
    "The module and its functions are designed to be used by blockchain developers looking to integrate Solana",
    "with other chains, leveraging the Photon system's capabilities to enhance their applications' reach and functionalities."
  ],
  "instructions": [
    {
      "name": "initialize",
      "docs": [
        "Initializes the Solana program with the provided configuration and protocol information.",
        "",
        "This method sets up the admin, chain ID, master smart contract, target rate, transmitters,",
        "and executors for the protocol. It uses the `Initialize` context to access the necessary accounts.",
        "",
        "# Arguments",
        "",
        "* `ctx` - The context containing the accounts to be initialized.",
        "* `eob_chain_id` - The chain ID for the Entangle Oracle Blockchain (EOB).",
        "* `eob_master_smart_contract` - The master smart contract, represented as a vector of bytes.",
        "* `consensus_target_rate` - The rate of signing operations to be executed.",
        "* `gov_transmitters` - A vector of Ethereum addresses representing the transmitters for the governance.",
        "* `gov_executors` - A vector of public keys representing the executors for the governance.",
        "",
        "# Returns",
        "",
        "Returns a result indicating the success or failure of the operation."
      ],
      "accounts": [
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "Admin account"
          ]
        },
        {
          "name": "protocolInfo",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Protocol info"
          ]
        },
        {
          "name": "config",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "System config"
          ]
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "System program"
          ]
        }
      ],
      "args": [
        {
          "name": "eobChainId",
          "type": "u64"
        },
        {
          "name": "eobMasterSmartContract",
          "type": "bytes"
        },
        {
          "name": "consensusTargetRate",
          "type": "u64"
        },
        {
          "name": "govTransmitters",
          "type": {
            "vec": {
              "defined": "EthAddress"
            }
          }
        },
        {
          "name": "govExecutors",
          "type": {
            "vec": "publicKey"
          }
        }
      ]
    },
    {
      "name": "loadOperation",
      "docs": [
        "Loads an operation in the Photon cross-chain messaging layer.",
        "",
        "This method serves as the first step in executing an operation. It verifies the provided operation data",
        "and sets the initial status of the operation.",
        "",
        "# Arguments",
        "",
        "* `ctx` - The context containing the accounts for loading the operation.",
        "* `op_data` - The data related to the operation.",
        "* `op_hash_cached` - The cached hash of the operation data.",
        "",
        "# Returns",
        "",
        "Returns a result indicating the success or failure of the operation."
      ],
      "accounts": [
        {
          "name": "executor",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "Executor account"
          ]
        },
        {
          "name": "protocolInfo",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Protocol info"
          ]
        },
        {
          "name": "opInfo",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Operation info"
          ]
        },
        {
          "name": "config",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "System config"
          ]
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "System program"
          ]
        }
      ],
      "args": [
        {
          "name": "opData",
          "type": {
            "defined": "OperationData"
          }
        },
        {
          "name": "opHashCached",
          "type": "bytes"
        }
      ]
    },
    {
      "name": "signOperation",
      "docs": [
        "Signs an operation in the Photon cross-chain messaging layer.",
        "",
        "This method serves as the step for signing an operation. It verifies the provided signatures",
        "and updates the operation status based on the achieved consensus.",
        "",
        "# Arguments",
        "",
        "* `ctx` - The context containing the accounts for signing the operation.",
        "* `op_hash` - The hash of the operation.",
        "* `signatures` - A vector of transmitter signatures.",
        "",
        "# Returns",
        "",
        "Returns a result indicating whether the consensus was reached or not."
      ],
      "accounts": [
        {
          "name": "executor",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "Executor account"
          ]
        },
        {
          "name": "opInfo",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Operation info"
          ]
        },
        {
          "name": "protocolInfo",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Protocol info"
          ]
        }
      ],
      "args": [
        {
          "name": "opHash",
          "type": "bytes"
        },
        {
          "name": "signatures",
          "type": {
            "vec": {
              "defined": "TransmitterSignature"
            }
          }
        }
      ],
      "returns": "bool"
    },
    {
      "name": "executeOperation",
      "accounts": [
        {
          "name": "executor",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "Executor account"
          ]
        },
        {
          "name": "opInfo",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Operation info"
          ]
        },
        {
          "name": "protocolInfo",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Protocol info"
          ]
        },
        {
          "name": "callAuthority",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Per-protocol call authority"
          ]
        }
      ],
      "args": [
        {
          "name": "opHash",
          "type": "bytes"
        }
      ]
    },
    {
      "name": "propose",
      "docs": [
        "Proposes a new operation to be processed by a target protocol in the Photon cross-chain messaging layer.",
        "",
        "This function facilitates cross-chain communication by proposing an operation to be executed",
        "on another blockchain. It handles the creation of a proposal event based on the specified",
        "details, incrementing the nonce in the system configuration to maintain a unique identifier",
        "for each proposal.",
        "",
        "# Arguments",
        "",
        "* `ctx` - The context containing the accounts necessary for making a proposal.",
        "* `protocol_id` - The identifier of the protocol.",
        "* `dst_chain_id` - The identifier of the destination chain where the proposal will be executed.",
        "* `protocol_address` - The address of the protocol on the destination chain, represented as a vector of bytes.",
        "* `function_selector` - The function selector for the proposal.",
        "* `params` - The parameters for the proposed function, represented as a vector of bytes.",
        "",
        "# Returns",
        "",
        "Returns a result indicating the success or failure of the proposal creation."
      ],
      "accounts": [
        {
          "name": "proposer",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "Proposer account"
          ]
        },
        {
          "name": "config",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "System config"
          ]
        },
        {
          "name": "protocolInfo",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Target protocol info"
          ]
        }
      ],
      "args": [
        {
          "name": "protocolId",
          "type": "bytes"
        },
        {
          "name": "dstChainId",
          "type": "u128"
        },
        {
          "name": "protocolAddress",
          "type": "bytes"
        },
        {
          "name": "functionSelector",
          "type": {
            "defined": "FunctionSelector"
          }
        },
        {
          "name": "params",
          "type": "bytes"
        }
      ]
    },
    {
      "name": "receivePhotonMsg",
      "docs": [
        "Handles the reception and execution of a photon message targeted to the gov protocol within",
        "the Photon cross-chain messaging layer.",
        "",
        "This function processes the photon message by invoking the associated program through CPI,",
        "specifically designed for code-based operations that fall under the governance protocol's",
        "scope. It ensures the proper execution path based on the code and parameters of the operation.",
        "",
        "# Arguments",
        "",
        "* `ctx` - The context containing the necessary accounts for processing the photon message.",
        "* `op_hash` - The hash of the operation being processed.",
        "* `code` - The code of the `function_selector` involved in the operation.",
        "* `params` - The parameters associated with the operation.",
        "",
        "# Returns",
        "",
        "Returns a result indicating the success or failure of processing the photon message.",
        ""
      ],
      "accounts": [
        {
          "name": "executor",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "Executor account"
          ]
        },
        {
          "name": "callAuthority",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "Call authority"
          ]
        },
        {
          "name": "opInfo",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Operation info"
          ]
        },
        {
          "name": "config",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "System config"
          ]
        },
        {
          "name": "govInfo",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Gov protocol info"
          ]
        },
        {
          "name": "targetProtocolInfo",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Target protocol info"
          ]
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "System program"
          ]
        }
      ],
      "args": [
        {
          "name": "opHash",
          "type": "bytes"
        },
        {
          "name": "code",
          "type": "bytes"
        },
        {
          "name": "params",
          "type": "bytes"
        }
      ]
    },
    {
      "name": "setAdmin",
      "docs": [
        "Updates global admin. Can only be called by deployer address.",
        "",
        "# Arguments",
        "",
        "* `ctx` - The context containing the necessary accounts.",
        "* `admin` - New global admin address.",
        "",
        "# Returns",
        "",
        "Returns a result with always Ok(()) status.",
        ""
      ],
      "accounts": [
        {
          "name": "deployer",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "Deployer address"
          ]
        },
        {
          "name": "config",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Config address"
          ]
        }
      ],
      "args": [
        {
          "name": "admin",
          "type": "publicKey"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "config",
      "docs": [
        "Represents the photon cross-chain messaging configuration stored in a Solana account.",
        "",
        "This structure holds essential information such as the admin's public key,",
        "the chain ID for the Entangle Oracle Blockchain (EOB), the master smart contract address,",
        "and a nonce value.",
        "",
        "# Fields",
        "",
        "* `admin` - The public key of the administrator.",
        "* `eob_chain_id` - The chain ID for the Entangle Oracle Blockchain.",
        "* `eob_master_smart_contract` - The address of the master smart contract.",
        "* `nonce` - A unique identifier.",
        "",
        "# Usage",
        "",
        "The `Config` struct is used as part of the photon cross-chain messaging layer."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "admin",
            "type": "publicKey"
          },
          {
            "name": "eobChainId",
            "type": "u64"
          },
          {
            "name": "eobMasterSmartContract",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "nonce",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "protocolInfo",
      "docs": [
        "Represents the information for a protocol within the Photon cross-chain messaging layer.",
        "",
        "The protocol is an identified unit registered in the governance (GOV) of the Photon messaging layer.",
        "Anything not registered in the GOV cannot send cross-chain messages.",
        "",
        "# Fields",
        "",
        "* `is_init` - Indicates whether the protocol is initialized.",
        "* `consensus_target_rate` - The rate of signing operations to be executed.",
        "* `protocol_address` - The public key of the protocol.",
        "* `transmitters` - The Ethereum addresses of entities that sign operations for execution.",
        "* `executors` - The Solana addresses authorized to execute operations in the Photon Endpoint Solana program.",
        "* `proposers` - The accounts permitted to call the Photon Endpoint for emitting a `Propose` event, which is meant for execution in a destination chain that is not Solana.",
        "",
        "# Usage",
        "",
        "The `ProtocolInfo` struct is utilized in the Photon cross-chain messaging layer."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "isInit",
            "type": "bool"
          },
          {
            "name": "consensusTargetRate",
            "type": "u64"
          },
          {
            "name": "protocolAddress",
            "type": "publicKey"
          },
          {
            "name": "transmitters",
            "type": {
              "array": [
                {
                  "defined": "EthAddress"
                },
                20
              ]
            }
          },
          {
            "name": "executors",
            "type": {
              "array": [
                "publicKey",
                20
              ]
            }
          },
          {
            "name": "proposers",
            "type": {
              "array": [
                "publicKey",
                20
              ]
            }
          }
        ]
      }
    },
    {
      "name": "opInfo",
      "docs": [
        "Represents information about an operation in the Photon cross-chain messaging layer.",
        "",
        "The `OpInfo` struct is utilized during the three steps of operation execution:",
        "loading, signing, and executing.",
        "",
        "# Fields",
        "",
        "* `status` - The current status of the operation.",
        "* `unique_signers` - An array of unique Ethereum addresses that have signed the operation.",
        "* `op_data` - The data related to the operation."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "status",
            "type": {
              "defined": "OpStatus"
            }
          },
          {
            "name": "uniqueSigners",
            "type": {
              "array": [
                {
                  "defined": "EthAddress"
                },
                16
              ]
            }
          },
          {
            "name": "opData",
            "type": {
              "defined": "OperationData"
            }
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "TransmitterSignature",
      "docs": [
        "The EVM-compatible signature format utilized to verify if an operation is signed by a transmitting agent.",
        "",
        "Example:",
        ""
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "v",
            "type": "u8"
          },
          {
            "name": "r",
            "type": "bytes"
          },
          {
            "name": "s",
            "type": "bytes"
          }
        ]
      }
    },
    {
      "name": "OperationData",
      "docs": [
        "The key data structure that is managed and utilized at every execution step: load, sign, execute.",
        "It is constructed within the executor module."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "protocolId",
            "type": "bytes"
          },
          {
            "name": "meta",
            "type": {
              "defined": "Meta"
            }
          },
          {
            "name": "srcChainId",
            "type": "u128"
          },
          {
            "name": "srcBlockNumber",
            "type": "u64"
          },
          {
            "name": "srcOpTxId",
            "type": "bytes"
          },
          {
            "name": "nonce",
            "type": "u64"
          },
          {
            "name": "destChainId",
            "type": "u128"
          },
          {
            "name": "protocolAddr",
            "type": "publicKey"
          },
          {
            "name": "functionSelector",
            "type": {
              "defined": "FunctionSelector"
            }
          },
          {
            "name": "params",
            "type": "bytes"
          },
          {
            "name": "reserved",
            "type": "bytes"
          }
        ]
      }
    },
    {
      "name": "GovOperation",
      "docs": [
        "Enumerates government operations with their corresponding unique operation codes,",
        "providing a structured way to serialize and match governance operations rather than relying on magic constants.",
        "",
        "This approach enables clearer and more maintainable code by replacing arbitrary numerical codes",
        "with descriptive enum variants, each associated with a specific governance action."
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "AddAllowedProtocol"
          },
          {
            "name": "AddAllowedProtocolAddress"
          },
          {
            "name": "RemoveAllowedProtocolAddress"
          },
          {
            "name": "AddAllowedProposerAddress"
          },
          {
            "name": "RemoveAllowedProposerAddress"
          },
          {
            "name": "AddExecutor"
          },
          {
            "name": "RemoveExecutor"
          },
          {
            "name": "AddTransmitters"
          },
          {
            "name": "RemoveTransmitters"
          },
          {
            "name": "UpdateTransmitters"
          },
          {
            "name": "SetConsensusTargetRate"
          }
        ]
      }
    },
    {
      "name": "FunctionSelector",
      "docs": [
        "Is utilized in the [execute_operation](../photon/fn.execute_operation.html) function to make",
        "it able to  match the `function_selector` by either code or name",
        "",
        "Example:",
        ""
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "ByCode",
            "fields": [
              "bytes"
            ]
          },
          {
            "name": "ByName",
            "fields": [
              "string"
            ]
          },
          {
            "name": "Dummy"
          }
        ]
      }
    },
    {
      "name": "OpStatus",
      "docs": [
        "Enumerates the different statuses an operation can have within the Photon cross-chain messaging",
        "system's execution pipeline.",
        "",
        "This enum helps track the progression of an operation from its initial state until it is fully",
        "executed, providing clarity and control over each phase of the operation's lifecycle.",
        "",
        "# Variants",
        "",
        "* `None` - Represents the default state of an operation before any processing has begun.",
        "This is the initial state when an operation is first created.",
        "* `Init` - Indicates that the operation has been initialized. This state is assigned after the",
        "operation is loaded and ready for further action, such as signing.",
        "* `Signed` - Signifies that the operation has been signed by the required parties.",
        "This state is crucial for validating that all necessary consents have been obtained before execution.",
        "* `Executed` - Marks that the operation has been successfully executed. This final state",
        "confirms that the operation's intended effects have been applied.",
        "",
        "Each state transition reflects significant checkpoints in the handling and processing of cross-chain messages, ensuring that each step is clearly delineated and verified."
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "None"
          },
          {
            "name": "Init"
          },
          {
            "name": "Signed"
          },
          {
            "name": "Executed"
          }
        ]
      }
    },
    {
      "name": "Meta",
      "docs": [
        "Aliasing type for Meta. The `meta` field within the [OperationData] stores protocol version and other subtleties"
      ],
      "type": {
        "kind": "alias",
        "value": {
          "array": [
            "u8",
            32
          ]
        }
      }
    },
    {
      "name": "Bytes32",
      "docs": [
        "Aliasing type for 32 raw bytes sequence"
      ],
      "type": {
        "kind": "alias",
        "value": {
          "array": [
            "u8",
            32
          ]
        }
      }
    },
    {
      "name": "EthAddress",
      "docs": [
        "Aliasing type for evm compatible shortened address"
      ],
      "type": {
        "kind": "alias",
        "value": {
          "array": [
            "u8",
            20
          ]
        }
      }
    }
  ],
  "events": [
    {
      "name": "ProposalLoaded",
      "fields": [
        {
          "name": "opHash",
          "type": "bytes",
          "index": false
        },
        {
          "name": "executor",
          "type": "publicKey",
          "index": false
        }
      ]
    },
    {
      "name": "ProposalApproved",
      "fields": [
        {
          "name": "opHash",
          "type": "bytes",
          "index": false
        },
        {
          "name": "executor",
          "type": "publicKey",
          "index": false
        }
      ]
    },
    {
      "name": "ProposalExecuted",
      "fields": [
        {
          "name": "opHash",
          "type": "bytes",
          "index": false
        },
        {
          "name": "executor",
          "type": "publicKey",
          "index": false
        }
      ]
    },
    {
      "name": "ProposeEvent",
      "fields": [
        {
          "name": "protocolId",
          "type": "bytes",
          "index": false
        },
        {
          "name": "nonce",
          "type": "u64",
          "index": false
        },
        {
          "name": "dstChainId",
          "type": "u128",
          "index": false
        },
        {
          "name": "protocolAddress",
          "type": "bytes",
          "index": false
        },
        {
          "name": "functionSelector",
          "type": "bytes",
          "index": false
        },
        {
          "name": "params",
          "type": "bytes",
          "index": false
        }
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "IsNotAdmin",
      "msg": "Is not admin"
    },
    {
      "code": 6001,
      "name": "ProtocolNotInit",
      "msg": "Protocol not init"
    },
    {
      "code": 6002,
      "name": "InvalidSignature",
      "msg": "Invalid signature"
    },
    {
      "code": 6003,
      "name": "OpIsNotForThisChain",
      "msg": "OpIsNotForThisChain"
    },
    {
      "code": 6004,
      "name": "InvalidEndpoint",
      "msg": "InvalidEndpoint"
    },
    {
      "code": 6005,
      "name": "OpStateInvalid",
      "msg": "OpStateInvalid"
    },
    {
      "code": 6006,
      "name": "CachedOpHashMismatch",
      "msg": "CachedOpHashMismatch"
    },
    {
      "code": 6007,
      "name": "ProtocolAddressMismatch",
      "msg": "ProtocolAddressMismatch"
    },
    {
      "code": 6008,
      "name": "TargetProtocolMismatch",
      "msg": "TargetProtocolMismatch"
    },
    {
      "code": 6009,
      "name": "ExecutorIsNotAllowed",
      "msg": "ExecutorIsNotAllowed"
    },
    {
      "code": 6010,
      "name": "ProposerIsNotAllowed",
      "msg": "ProposerIsNotAllowed"
    },
    {
      "code": 6011,
      "name": "OperationNotApproved",
      "msg": "OperationNotApproved"
    },
    {
      "code": 6012,
      "name": "InvalidProtoMsg",
      "msg": "InvalidProtoMsg"
    },
    {
      "code": 6013,
      "name": "InvalidGovMsg",
      "msg": "InvalidGovMsg"
    },
    {
      "code": 6014,
      "name": "InvalidMethodSelector",
      "msg": "InvalidMethodSelector"
    },
    {
      "code": 6015,
      "name": "InvalidOpData",
      "msg": "InvalidOpData"
    },
    {
      "code": 6016,
      "name": "InvalidAddress",
      "msg": "InvalidAddress"
    },
    {
      "code": 6017,
      "name": "ProtocolAddressNotProvided",
      "msg": "ProtocolAddressNotProvided"
    },
    {
      "code": 6018,
      "name": "NoTransmittersAllowed",
      "msg": "NoTransmittersAllowed"
    },
    {
      "code": 6019,
      "name": "MaxTransmittersExceeded",
      "msg": "MaxTransmittersExceeded"
    },
    {
      "code": 6020,
      "name": "MaxExecutorsExceeded",
      "msg": "MaxExecutorsExceeded"
    },
    {
      "code": 6021,
      "name": "ExecutorIsAlreadyAllowed",
      "msg": "ExecutorIsAlreadyAllowed"
    },
    {
      "code": 6022,
      "name": "ProposerIsAlreadyAllowed",
      "msg": "ProposerIsAlreadyAllowed"
    },
    {
      "code": 6023,
      "name": "TryingToRemoveLastGovExecutor",
      "msg": "TryingToRemoveLastGovExecutor"
    },
    {
      "code": 6024,
      "name": "InvalidExecutorAddress",
      "msg": "InvalidExecutorAddress"
    },
    {
      "code": 6025,
      "name": "InvalidProposerAddress",
      "msg": "InvalidProposerAddress"
    },
    {
      "code": 6026,
      "name": "MaxProposersExceeded",
      "msg": "MaxProposersExceeded"
    },
    {
      "code": 6027,
      "name": "ConsensusTargetRateTooLow",
      "msg": "ConsensusTargetRateTooLow"
    },
    {
      "code": 6028,
      "name": "ConsensusTargetRateTooHigh",
      "msg": "ConsensusTargetRateTooHigh"
    },
    {
      "code": 6029,
      "name": "SelectorTooBig",
      "msg": "SelectorTooBig"
    }
  ]
};

export const IDL: Photon = {
  "version": "0.1.0",
  "name": "photon",
  "docs": [
    "The `photon` module encapsulates all operations related to cross-chain messaging on the Solana blockchain,",
    "leveraging the capabilities of the Photon cross-chain messaging layer. It defines the governance and",
    "operational structure necessary to initiate, approve, and execute operations across blockchains.",
    "",
    "## Constants",
    "- `SOLANA_CHAIN_ID`: Unique identifier for the Solana chain, used for validation.",
    "- `RATE_DECIMALS`: Used for calculations involving rate percentages in consensus processes.",
    "- `ROOT`: A byte string used as a base for seed generation in account addresses.",
    "- `MAX_TRANSMITTERS`, `MAX_EXECUTORS`, `MAX_PROPOSERS`: Define the maximum allowable numbers of transmitters,",
    "executors, and proposers respectively to ensure the system's scalability and manageability.",
    "",
    "## Key Operations",
    "- **Initialize**: Sets up the initial configuration for protocols, defining administrators, chain IDs,",
    "smart contracts, and operational parameters such as rate and role-based limitations.",
    "- **Load Operation**: The first step in operation execution, verifying the operation's integrity and",
    "preparing it for further processing by setting its initial state.",
    "- **Sign Operation**: Involves validating signatures to achieve consensus among transmitters, updating",
    "the operation status upon achieving the required threshold.",
    "- **Execute Operation**: The final step where the operation is executed based on the received and",
    "validated instructions, with potential cross-program invocations if the operation involves governance",
    "protocols.",
    "- **Propose**: Allows registered proposers to submit operations intended to be executed on other chains,",
    "managing these proposals through events that ensure transparency and traceability.",
    "- **Receive Photon Message**: Specialized in handling operations directed at the governance protocol,",
    "executing code-based operations that affect the system's governance structure.",
    "",
    "## Structs and Contexts",
    "- `Initialize`, `LoadOperation`, `SignOperation`, `ExecuteOperation`: Context structs designed to facilitate",
    "the respective operations by providing necessary accounts and permissions checks.",
    "- `Propose`, `ReceivePhotonMsg`: Handle specific scenarios where operations need to be proposed to other chains",
    "or where governance-related messages are processed.",
    "",
    "## Custom Errors",
    "A comprehensive set of custom errors (`CustomError`) enhances error handling by providing clear, contextual",
    "messages that aid in debugging and user feedback, covering a range of issues from permission errors to",
    "mismatches in operation data.",
    "",
    "## Usage",
    "This program is crucial for maintaining a robust and secure cross-chain communication infrastructure on Solana,",
    "supporting a wide range of decentralized applications that require interaction between different blockchains.",
    "It emphasizes security, scalability, and interoperability, ensuring that operations not only adhere to protocol",
    "requirements but also maintain integrity across executions.",
    "",
    "The module and its functions are designed to be used by blockchain developers looking to integrate Solana",
    "with other chains, leveraging the Photon system's capabilities to enhance their applications' reach and functionalities."
  ],
  "instructions": [
    {
      "name": "initialize",
      "docs": [
        "Initializes the Solana program with the provided configuration and protocol information.",
        "",
        "This method sets up the admin, chain ID, master smart contract, target rate, transmitters,",
        "and executors for the protocol. It uses the `Initialize` context to access the necessary accounts.",
        "",
        "# Arguments",
        "",
        "* `ctx` - The context containing the accounts to be initialized.",
        "* `eob_chain_id` - The chain ID for the Entangle Oracle Blockchain (EOB).",
        "* `eob_master_smart_contract` - The master smart contract, represented as a vector of bytes.",
        "* `consensus_target_rate` - The rate of signing operations to be executed.",
        "* `gov_transmitters` - A vector of Ethereum addresses representing the transmitters for the governance.",
        "* `gov_executors` - A vector of public keys representing the executors for the governance.",
        "",
        "# Returns",
        "",
        "Returns a result indicating the success or failure of the operation."
      ],
      "accounts": [
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "Admin account"
          ]
        },
        {
          "name": "protocolInfo",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Protocol info"
          ]
        },
        {
          "name": "config",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "System config"
          ]
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "System program"
          ]
        }
      ],
      "args": [
        {
          "name": "eobChainId",
          "type": "u64"
        },
        {
          "name": "eobMasterSmartContract",
          "type": "bytes"
        },
        {
          "name": "consensusTargetRate",
          "type": "u64"
        },
        {
          "name": "govTransmitters",
          "type": {
            "vec": {
              "defined": "EthAddress"
            }
          }
        },
        {
          "name": "govExecutors",
          "type": {
            "vec": "publicKey"
          }
        }
      ]
    },
    {
      "name": "loadOperation",
      "docs": [
        "Loads an operation in the Photon cross-chain messaging layer.",
        "",
        "This method serves as the first step in executing an operation. It verifies the provided operation data",
        "and sets the initial status of the operation.",
        "",
        "# Arguments",
        "",
        "* `ctx` - The context containing the accounts for loading the operation.",
        "* `op_data` - The data related to the operation.",
        "* `op_hash_cached` - The cached hash of the operation data.",
        "",
        "# Returns",
        "",
        "Returns a result indicating the success or failure of the operation."
      ],
      "accounts": [
        {
          "name": "executor",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "Executor account"
          ]
        },
        {
          "name": "protocolInfo",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Protocol info"
          ]
        },
        {
          "name": "opInfo",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Operation info"
          ]
        },
        {
          "name": "config",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "System config"
          ]
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "System program"
          ]
        }
      ],
      "args": [
        {
          "name": "opData",
          "type": {
            "defined": "OperationData"
          }
        },
        {
          "name": "opHashCached",
          "type": "bytes"
        }
      ]
    },
    {
      "name": "signOperation",
      "docs": [
        "Signs an operation in the Photon cross-chain messaging layer.",
        "",
        "This method serves as the step for signing an operation. It verifies the provided signatures",
        "and updates the operation status based on the achieved consensus.",
        "",
        "# Arguments",
        "",
        "* `ctx` - The context containing the accounts for signing the operation.",
        "* `op_hash` - The hash of the operation.",
        "* `signatures` - A vector of transmitter signatures.",
        "",
        "# Returns",
        "",
        "Returns a result indicating whether the consensus was reached or not."
      ],
      "accounts": [
        {
          "name": "executor",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "Executor account"
          ]
        },
        {
          "name": "opInfo",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Operation info"
          ]
        },
        {
          "name": "protocolInfo",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Protocol info"
          ]
        }
      ],
      "args": [
        {
          "name": "opHash",
          "type": "bytes"
        },
        {
          "name": "signatures",
          "type": {
            "vec": {
              "defined": "TransmitterSignature"
            }
          }
        }
      ],
      "returns": "bool"
    },
    {
      "name": "executeOperation",
      "accounts": [
        {
          "name": "executor",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "Executor account"
          ]
        },
        {
          "name": "opInfo",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Operation info"
          ]
        },
        {
          "name": "protocolInfo",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Protocol info"
          ]
        },
        {
          "name": "callAuthority",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Per-protocol call authority"
          ]
        }
      ],
      "args": [
        {
          "name": "opHash",
          "type": "bytes"
        }
      ]
    },
    {
      "name": "propose",
      "docs": [
        "Proposes a new operation to be processed by a target protocol in the Photon cross-chain messaging layer.",
        "",
        "This function facilitates cross-chain communication by proposing an operation to be executed",
        "on another blockchain. It handles the creation of a proposal event based on the specified",
        "details, incrementing the nonce in the system configuration to maintain a unique identifier",
        "for each proposal.",
        "",
        "# Arguments",
        "",
        "* `ctx` - The context containing the accounts necessary for making a proposal.",
        "* `protocol_id` - The identifier of the protocol.",
        "* `dst_chain_id` - The identifier of the destination chain where the proposal will be executed.",
        "* `protocol_address` - The address of the protocol on the destination chain, represented as a vector of bytes.",
        "* `function_selector` - The function selector for the proposal.",
        "* `params` - The parameters for the proposed function, represented as a vector of bytes.",
        "",
        "# Returns",
        "",
        "Returns a result indicating the success or failure of the proposal creation."
      ],
      "accounts": [
        {
          "name": "proposer",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "Proposer account"
          ]
        },
        {
          "name": "config",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "System config"
          ]
        },
        {
          "name": "protocolInfo",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Target protocol info"
          ]
        }
      ],
      "args": [
        {
          "name": "protocolId",
          "type": "bytes"
        },
        {
          "name": "dstChainId",
          "type": "u128"
        },
        {
          "name": "protocolAddress",
          "type": "bytes"
        },
        {
          "name": "functionSelector",
          "type": {
            "defined": "FunctionSelector"
          }
        },
        {
          "name": "params",
          "type": "bytes"
        }
      ]
    },
    {
      "name": "receivePhotonMsg",
      "docs": [
        "Handles the reception and execution of a photon message targeted to the gov protocol within",
        "the Photon cross-chain messaging layer.",
        "",
        "This function processes the photon message by invoking the associated program through CPI,",
        "specifically designed for code-based operations that fall under the governance protocol's",
        "scope. It ensures the proper execution path based on the code and parameters of the operation.",
        "",
        "# Arguments",
        "",
        "* `ctx` - The context containing the necessary accounts for processing the photon message.",
        "* `op_hash` - The hash of the operation being processed.",
        "* `code` - The code of the `function_selector` involved in the operation.",
        "* `params` - The parameters associated with the operation.",
        "",
        "# Returns",
        "",
        "Returns a result indicating the success or failure of processing the photon message.",
        ""
      ],
      "accounts": [
        {
          "name": "executor",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "Executor account"
          ]
        },
        {
          "name": "callAuthority",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "Call authority"
          ]
        },
        {
          "name": "opInfo",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Operation info"
          ]
        },
        {
          "name": "config",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "System config"
          ]
        },
        {
          "name": "govInfo",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Gov protocol info"
          ]
        },
        {
          "name": "targetProtocolInfo",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Target protocol info"
          ]
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "System program"
          ]
        }
      ],
      "args": [
        {
          "name": "opHash",
          "type": "bytes"
        },
        {
          "name": "code",
          "type": "bytes"
        },
        {
          "name": "params",
          "type": "bytes"
        }
      ]
    },
    {
      "name": "setAdmin",
      "docs": [
        "Updates global admin. Can only be called by deployer address.",
        "",
        "# Arguments",
        "",
        "* `ctx` - The context containing the necessary accounts.",
        "* `admin` - New global admin address.",
        "",
        "# Returns",
        "",
        "Returns a result with always Ok(()) status.",
        ""
      ],
      "accounts": [
        {
          "name": "deployer",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "Deployer address"
          ]
        },
        {
          "name": "config",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Config address"
          ]
        }
      ],
      "args": [
        {
          "name": "admin",
          "type": "publicKey"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "config",
      "docs": [
        "Represents the photon cross-chain messaging configuration stored in a Solana account.",
        "",
        "This structure holds essential information such as the admin's public key,",
        "the chain ID for the Entangle Oracle Blockchain (EOB), the master smart contract address,",
        "and a nonce value.",
        "",
        "# Fields",
        "",
        "* `admin` - The public key of the administrator.",
        "* `eob_chain_id` - The chain ID for the Entangle Oracle Blockchain.",
        "* `eob_master_smart_contract` - The address of the master smart contract.",
        "* `nonce` - A unique identifier.",
        "",
        "# Usage",
        "",
        "The `Config` struct is used as part of the photon cross-chain messaging layer."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "admin",
            "type": "publicKey"
          },
          {
            "name": "eobChainId",
            "type": "u64"
          },
          {
            "name": "eobMasterSmartContract",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "nonce",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "protocolInfo",
      "docs": [
        "Represents the information for a protocol within the Photon cross-chain messaging layer.",
        "",
        "The protocol is an identified unit registered in the governance (GOV) of the Photon messaging layer.",
        "Anything not registered in the GOV cannot send cross-chain messages.",
        "",
        "# Fields",
        "",
        "* `is_init` - Indicates whether the protocol is initialized.",
        "* `consensus_target_rate` - The rate of signing operations to be executed.",
        "* `protocol_address` - The public key of the protocol.",
        "* `transmitters` - The Ethereum addresses of entities that sign operations for execution.",
        "* `executors` - The Solana addresses authorized to execute operations in the Photon Endpoint Solana program.",
        "* `proposers` - The accounts permitted to call the Photon Endpoint for emitting a `Propose` event, which is meant for execution in a destination chain that is not Solana.",
        "",
        "# Usage",
        "",
        "The `ProtocolInfo` struct is utilized in the Photon cross-chain messaging layer."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "isInit",
            "type": "bool"
          },
          {
            "name": "consensusTargetRate",
            "type": "u64"
          },
          {
            "name": "protocolAddress",
            "type": "publicKey"
          },
          {
            "name": "transmitters",
            "type": {
              "array": [
                {
                  "defined": "EthAddress"
                },
                20
              ]
            }
          },
          {
            "name": "executors",
            "type": {
              "array": [
                "publicKey",
                20
              ]
            }
          },
          {
            "name": "proposers",
            "type": {
              "array": [
                "publicKey",
                20
              ]
            }
          }
        ]
      }
    },
    {
      "name": "opInfo",
      "docs": [
        "Represents information about an operation in the Photon cross-chain messaging layer.",
        "",
        "The `OpInfo` struct is utilized during the three steps of operation execution:",
        "loading, signing, and executing.",
        "",
        "# Fields",
        "",
        "* `status` - The current status of the operation.",
        "* `unique_signers` - An array of unique Ethereum addresses that have signed the operation.",
        "* `op_data` - The data related to the operation."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "status",
            "type": {
              "defined": "OpStatus"
            }
          },
          {
            "name": "uniqueSigners",
            "type": {
              "array": [
                {
                  "defined": "EthAddress"
                },
                16
              ]
            }
          },
          {
            "name": "opData",
            "type": {
              "defined": "OperationData"
            }
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "TransmitterSignature",
      "docs": [
        "The EVM-compatible signature format utilized to verify if an operation is signed by a transmitting agent.",
        "",
        "Example:",
        ""
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "v",
            "type": "u8"
          },
          {
            "name": "r",
            "type": "bytes"
          },
          {
            "name": "s",
            "type": "bytes"
          }
        ]
      }
    },
    {
      "name": "OperationData",
      "docs": [
        "The key data structure that is managed and utilized at every execution step: load, sign, execute.",
        "It is constructed within the executor module."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "protocolId",
            "type": "bytes"
          },
          {
            "name": "meta",
            "type": {
              "defined": "Meta"
            }
          },
          {
            "name": "srcChainId",
            "type": "u128"
          },
          {
            "name": "srcBlockNumber",
            "type": "u64"
          },
          {
            "name": "srcOpTxId",
            "type": "bytes"
          },
          {
            "name": "nonce",
            "type": "u64"
          },
          {
            "name": "destChainId",
            "type": "u128"
          },
          {
            "name": "protocolAddr",
            "type": "publicKey"
          },
          {
            "name": "functionSelector",
            "type": {
              "defined": "FunctionSelector"
            }
          },
          {
            "name": "params",
            "type": "bytes"
          },
          {
            "name": "reserved",
            "type": "bytes"
          }
        ]
      }
    },
    {
      "name": "GovOperation",
      "docs": [
        "Enumerates government operations with their corresponding unique operation codes,",
        "providing a structured way to serialize and match governance operations rather than relying on magic constants.",
        "",
        "This approach enables clearer and more maintainable code by replacing arbitrary numerical codes",
        "with descriptive enum variants, each associated with a specific governance action."
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "AddAllowedProtocol"
          },
          {
            "name": "AddAllowedProtocolAddress"
          },
          {
            "name": "RemoveAllowedProtocolAddress"
          },
          {
            "name": "AddAllowedProposerAddress"
          },
          {
            "name": "RemoveAllowedProposerAddress"
          },
          {
            "name": "AddExecutor"
          },
          {
            "name": "RemoveExecutor"
          },
          {
            "name": "AddTransmitters"
          },
          {
            "name": "RemoveTransmitters"
          },
          {
            "name": "UpdateTransmitters"
          },
          {
            "name": "SetConsensusTargetRate"
          }
        ]
      }
    },
    {
      "name": "FunctionSelector",
      "docs": [
        "Is utilized in the [execute_operation](../photon/fn.execute_operation.html) function to make",
        "it able to  match the `function_selector` by either code or name",
        "",
        "Example:",
        ""
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "ByCode",
            "fields": [
              "bytes"
            ]
          },
          {
            "name": "ByName",
            "fields": [
              "string"
            ]
          },
          {
            "name": "Dummy"
          }
        ]
      }
    },
    {
      "name": "OpStatus",
      "docs": [
        "Enumerates the different statuses an operation can have within the Photon cross-chain messaging",
        "system's execution pipeline.",
        "",
        "This enum helps track the progression of an operation from its initial state until it is fully",
        "executed, providing clarity and control over each phase of the operation's lifecycle.",
        "",
        "# Variants",
        "",
        "* `None` - Represents the default state of an operation before any processing has begun.",
        "This is the initial state when an operation is first created.",
        "* `Init` - Indicates that the operation has been initialized. This state is assigned after the",
        "operation is loaded and ready for further action, such as signing.",
        "* `Signed` - Signifies that the operation has been signed by the required parties.",
        "This state is crucial for validating that all necessary consents have been obtained before execution.",
        "* `Executed` - Marks that the operation has been successfully executed. This final state",
        "confirms that the operation's intended effects have been applied.",
        "",
        "Each state transition reflects significant checkpoints in the handling and processing of cross-chain messages, ensuring that each step is clearly delineated and verified."
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "None"
          },
          {
            "name": "Init"
          },
          {
            "name": "Signed"
          },
          {
            "name": "Executed"
          }
        ]
      }
    },
    {
      "name": "Meta",
      "docs": [
        "Aliasing type for Meta. The `meta` field within the [OperationData] stores protocol version and other subtleties"
      ],
      "type": {
        "kind": "alias",
        "value": {
          "array": [
            "u8",
            32
          ]
        }
      }
    },
    {
      "name": "Bytes32",
      "docs": [
        "Aliasing type for 32 raw bytes sequence"
      ],
      "type": {
        "kind": "alias",
        "value": {
          "array": [
            "u8",
            32
          ]
        }
      }
    },
    {
      "name": "EthAddress",
      "docs": [
        "Aliasing type for evm compatible shortened address"
      ],
      "type": {
        "kind": "alias",
        "value": {
          "array": [
            "u8",
            20
          ]
        }
      }
    }
  ],
  "events": [
    {
      "name": "ProposalLoaded",
      "fields": [
        {
          "name": "opHash",
          "type": "bytes",
          "index": false
        },
        {
          "name": "executor",
          "type": "publicKey",
          "index": false
        }
      ]
    },
    {
      "name": "ProposalApproved",
      "fields": [
        {
          "name": "opHash",
          "type": "bytes",
          "index": false
        },
        {
          "name": "executor",
          "type": "publicKey",
          "index": false
        }
      ]
    },
    {
      "name": "ProposalExecuted",
      "fields": [
        {
          "name": "opHash",
          "type": "bytes",
          "index": false
        },
        {
          "name": "executor",
          "type": "publicKey",
          "index": false
        }
      ]
    },
    {
      "name": "ProposeEvent",
      "fields": [
        {
          "name": "protocolId",
          "type": "bytes",
          "index": false
        },
        {
          "name": "nonce",
          "type": "u64",
          "index": false
        },
        {
          "name": "dstChainId",
          "type": "u128",
          "index": false
        },
        {
          "name": "protocolAddress",
          "type": "bytes",
          "index": false
        },
        {
          "name": "functionSelector",
          "type": "bytes",
          "index": false
        },
        {
          "name": "params",
          "type": "bytes",
          "index": false
        }
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "IsNotAdmin",
      "msg": "Is not admin"
    },
    {
      "code": 6001,
      "name": "ProtocolNotInit",
      "msg": "Protocol not init"
    },
    {
      "code": 6002,
      "name": "InvalidSignature",
      "msg": "Invalid signature"
    },
    {
      "code": 6003,
      "name": "OpIsNotForThisChain",
      "msg": "OpIsNotForThisChain"
    },
    {
      "code": 6004,
      "name": "InvalidEndpoint",
      "msg": "InvalidEndpoint"
    },
    {
      "code": 6005,
      "name": "OpStateInvalid",
      "msg": "OpStateInvalid"
    },
    {
      "code": 6006,
      "name": "CachedOpHashMismatch",
      "msg": "CachedOpHashMismatch"
    },
    {
      "code": 6007,
      "name": "ProtocolAddressMismatch",
      "msg": "ProtocolAddressMismatch"
    },
    {
      "code": 6008,
      "name": "TargetProtocolMismatch",
      "msg": "TargetProtocolMismatch"
    },
    {
      "code": 6009,
      "name": "ExecutorIsNotAllowed",
      "msg": "ExecutorIsNotAllowed"
    },
    {
      "code": 6010,
      "name": "ProposerIsNotAllowed",
      "msg": "ProposerIsNotAllowed"
    },
    {
      "code": 6011,
      "name": "OperationNotApproved",
      "msg": "OperationNotApproved"
    },
    {
      "code": 6012,
      "name": "InvalidProtoMsg",
      "msg": "InvalidProtoMsg"
    },
    {
      "code": 6013,
      "name": "InvalidGovMsg",
      "msg": "InvalidGovMsg"
    },
    {
      "code": 6014,
      "name": "InvalidMethodSelector",
      "msg": "InvalidMethodSelector"
    },
    {
      "code": 6015,
      "name": "InvalidOpData",
      "msg": "InvalidOpData"
    },
    {
      "code": 6016,
      "name": "InvalidAddress",
      "msg": "InvalidAddress"
    },
    {
      "code": 6017,
      "name": "ProtocolAddressNotProvided",
      "msg": "ProtocolAddressNotProvided"
    },
    {
      "code": 6018,
      "name": "NoTransmittersAllowed",
      "msg": "NoTransmittersAllowed"
    },
    {
      "code": 6019,
      "name": "MaxTransmittersExceeded",
      "msg": "MaxTransmittersExceeded"
    },
    {
      "code": 6020,
      "name": "MaxExecutorsExceeded",
      "msg": "MaxExecutorsExceeded"
    },
    {
      "code": 6021,
      "name": "ExecutorIsAlreadyAllowed",
      "msg": "ExecutorIsAlreadyAllowed"
    },
    {
      "code": 6022,
      "name": "ProposerIsAlreadyAllowed",
      "msg": "ProposerIsAlreadyAllowed"
    },
    {
      "code": 6023,
      "name": "TryingToRemoveLastGovExecutor",
      "msg": "TryingToRemoveLastGovExecutor"
    },
    {
      "code": 6024,
      "name": "InvalidExecutorAddress",
      "msg": "InvalidExecutorAddress"
    },
    {
      "code": 6025,
      "name": "InvalidProposerAddress",
      "msg": "InvalidProposerAddress"
    },
    {
      "code": 6026,
      "name": "MaxProposersExceeded",
      "msg": "MaxProposersExceeded"
    },
    {
      "code": 6027,
      "name": "ConsensusTargetRateTooLow",
      "msg": "ConsensusTargetRateTooLow"
    },
    {
      "code": 6028,
      "name": "ConsensusTargetRateTooHigh",
      "msg": "ConsensusTargetRateTooHigh"
    },
    {
      "code": 6029,
      "name": "SelectorTooBig",
      "msg": "SelectorTooBig"
    }
  ]
};
