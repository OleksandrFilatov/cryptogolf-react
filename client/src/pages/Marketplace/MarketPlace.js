import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from "react-router";
import axios from "axios";
import Web3 from "web3";
import { Form, Dropdown, InputGroup, FormControl, Button, Row, Col, Overlay, Tooltip } from 'react-bootstrap'
import { MdRefresh } from 'react-icons/md'
import { BiFilter } from 'react-icons/bi'
import { IoIosArrowDown } from 'react-icons/io'
import { FaSearch, FaCaretDown, FaCopy, FaBars } from "react-icons/fa"
import Loader from 'react-loader-spinner';
import { Styles } from "./styles"

import RangeSlider from '../../component/common/RangeSlider'
import MarketCard from "../../component/Card/MarketCard"
import ProfileModal from '../../component/Modal/ProfileModal'

import EthImg from '../../assets/images/eth.png'
import BscImg from '../../assets/images/bsc.png'
import GolfImg from '../../assets/images/logo1.png'
import Avatar from '../../assets/images/dicebear.svg'

import { EthereumContractAddress, BinanceContractAddress } from "../../contracts/address"
import etherContractAbi from '../../abi/etherContract.json'
import binanceContractAbi from '../../abi/binanceContract.json'
import { getUserData } from "../../redux/actions";

const MarketPlace = ({ handleExit }) => {

    const dispatch = useDispatch(null)
    const history = useHistory()
    const sortMenuRef = useRef()
    const target = useRef()
    const dropdown_text = useRef()

    const { chainId, walletAddress } = useSelector(state => state.connect)
    const { user } = useSelector(state => state.user)
    const tokenName = "GOLFPUNKS"

    const [sorted, setSorted] = useState(false)
    const [show, setShow] = useState(false)
    const [pending, setPending] = useState(false)
    const [showNavFilter, setShowNavFilter] = useState(false)
    const [isPrice, setIsPrice] = useState(false)
    const [searchID, setSearchID] = useState('')
    const [nftTokens, setNFTTokens] = useState([])
    const [etherNFTs, setEtherNFTs] = useState([])
    const [bscNFTs, setBscNFTs] = useState([])
    const [filteredNFTs, setFilteredNFTs] = useState([])
    const [ethPrice, setEthPrice] = useState(0)
    const [bscPrice, setBscPrice] = useState(0)
    const [showProfileModal, setShowProfileModal] = useState(false)
    const [sortKey, setSortKey] = useState("Listed")
    const [filterToken, setFilterToken] = useState(['ether', 'bsc', 'golf'])
    const [filterNetwork, setFilterNetwork] = useState(['ether', 'bsc'])
    const [filterStatus, setFilterStatus] = useState(['Sale', 'Offer', 'New'])
    const [filterProperty, setFilterProperty] = useState(['PRO', 'Break 70', 'Break 80', 'Break 90 ', 'Break 100'])
    const [minPrice, setMinPrice] = useState(0)
    const [maxPrice, setMaxPrice] = useState(100)
    const [pagenum, setPagenum] = useState(1)
    const pagesize = 32;

    useEffect(() => {
        if (walletAddress !== null) {
            if (chainId === 1 || chainId === 3 || chainId === 56 || chainId === 97) {
                dispatch(getUserData(walletAddress))
            }
        }
    }, [walletAddress, chainId, dispatch])

    useEffect(() => {
        if (walletAddress !== null) {
            if (chainId === 1 || chainId === 3 || chainId === 56 || chainId === 97) {
                if (!pending) {
                    setPagenum(1)
                    getAllTokenData()
                }
            }
        }
    }, [walletAddress])

    useEffect(() => {
        if (walletAddress !== null && sorted === true) {
            handleSort()
        }
    }, [walletAddress, sortKey])

    useEffect(() => {
        if (walletAddress !== null && (chainId === 1 || chainId === 3 || chainId === 56 || chainId === 97)) {
            handleSearchID()
        }
    }, [walletAddress, searchID])

    useEffect(() => {
        if (walletAddress !== null && nftTokens.length > 0) {
            setPending(true)
            setFilteredNFTs([])
            const result = handleSearch()
            if (result.length > 0) {
                console.log("11111111111")
                getMetaData(result, false)
            } else {
                setPending(false)
            }
        }
    }, [walletAddress, filterNetwork, filterStatus, filterToken])

    useEffect(() => {
        if (walletAddress !== null && pagenum > 1) {
            handlePagination()
        }
    }, [walletAddress, pagenum])

    useEffect(() => {
        if (walletAddress !== null && isPrice === true) {
            handleFilterPrice()
        }
    }, [walletAddress, isPrice])

    const getAllTokenData = async () => {
        setPending(true)
        setNFTTokens([])
        setFilteredNFTs([])
        setSortKey("Listed")
        setFilterToken(['ether', 'bsc', 'golf'])
        setFilterNetwork(['ether', 'bsc'])
        setFilterStatus(['Sale', 'Offer', 'New'])
        setFilterProperty(['PRO', 'Break 70', 'Break 80', 'Break 90 ', 'Break 100'])

        let etherTokenData = []
        let bscTokenData = []
        let token_id;
        if (filterNetwork.indexOf('ether') > -1) {
            const web3 = new Web3(new Web3.providers.HttpProvider(process.env.REACT_APP_ETHER_RPC_URL))
            const contract = new web3.eth.Contract(etherContractAbi, EthereumContractAddress);
            const tokenPrice = await contract.methods.getTokenPrice().call()
            setEthPrice(Web3.utils.fromWei(Number(tokenPrice).toString(), 'ether'))
            let etherTokens = await contract.methods.getAllTokens().call();
            if (etherTokens !== "[]") {
                etherTokens = etherTokens.split(",]")[0] + "]"
            }
            etherTokens = JSON.parse(etherTokens)
            etherTokenData = await Promise.all(etherTokens.map(async (data) => {
                token_id = data.tokenURI.split("ipfs://")[1].split("/")[1].split(".json")[0];
                return {
                    network: 'ether',
                    token_id: parseInt(token_id),
                    tokenURI: data.tokenURI,
                    owner: data.owner,
                    highestOfferPrice: Number(data.highestOffer.split(",")[0]),
                    highestOfferType: Number(data.highestOffer.split(",")[1]),
                    lastSoldPrice: Number(data.lastSold.split(",")[0]),
                    lastSoldCurrency: Number(data.lastSold.split(",")[1]),
                    lastSoldTime: Number(data.lastSold.split(",")[2]),
                    listPrice: Number(data.listPrice.split(",")[0]),
                    listType: Number(data.listPrice.split(",")[1]),
                    listTime: Number(data.listPrice.split(",")[2])
                }
            }))
            setEtherNFTs(etherTokenData)
        }
        if (filterNetwork.indexOf('bsc') > -1) {
            const web3 = new Web3(new Web3.providers.HttpProvider(process.env.REACT_APP_BSC_RPC_URL))
            const contract = new web3.eth.Contract(binanceContractAbi, BinanceContractAddress);
            const tokenPrice = await contract.methods.getTokenPrice().call();
            setBscPrice(Web3.utils.fromWei(Number(tokenPrice).toString(), 'ether'))
            let bscTokens = await contract.methods.getAllTokens().call();
            if (bscTokens !== "[]") {
                bscTokens = bscTokens.split(",]")[0] + "]"
            }
            bscTokens = JSON.parse(bscTokens)
            bscTokenData = await Promise.all(bscTokens.map(async (data) => {
                token_id = data.tokenURI.split("ipfs://")[1].split("/")[1].split(".json")[0];
                return {
                    network: 'bsc',
                    token_id: parseInt(token_id) - 5000,
                    tokenURI: data.tokenURI,
                    owner: data.owner,
                    highestOfferPrice: Number(data.highestOffer.split(",")[0]),
                    highestOfferType: Number(data.highestOffer.split(",")[1]),
                    lastSoldPrice: Number(data.lastSold.split(",")[0]),
                    lastSoldCurrency: Number(data.lastSold.split(",")[1]),
                    lastSoldTime: Number(data.lastSold.split(",")[2]),
                    listPrice: Number(data.listPrice.split(",")[0]),
                    listType: Number(data.listPrice.split(",")[1]),
                    listTime: Number(data.listPrice.split(",")[2])
                }
            }))
            setBscNFTs(bscTokenData)
        }

        let tokenData = etherTokenData.concat(bscTokenData)
        tokenData = tokenData.sort((a, b) => {
            return parseInt(a.token_id) - parseInt(b.token_id)
        })
        setNFTTokens(tokenData)

        tokenData = await tokenData.sort((a, b) => {
            return parseInt(b.listTime) - parseInt(a.listTime)
        })

        let token_metadata = [];
        const to = tokenData.length > 32 ? 32 : tokenData.length
        for (let i = 0; i < to; i++) {
            try {
                token_id = tokenData[i].token_id
                const res = await axios.get("https://cryptogolf.mypinata.cloud/ipfs/" + tokenData[i].tokenURI.split("ipfs://")[1]);
                await token_metadata.push({
                    ...tokenData[i],
                    image_original_url: "https://cryptogolf.mypinata.cloud/ipfs/" + res.data.image.split("ipfs://")[1],
                    name: res.data.name,
                    description: res.data.description,
                    dna: res.data.dna,
                    date: res.data.date,
                    class: res.data.attributes.filter(attr => attr.trait_type === 'Class').length > 0 ?
                        res.data.attributes.filter(attr => attr.trait_type === 'Class')[0].value : ''
                })
            } catch (err) {
                console.log("Error: ", err)
            }
        }
        setFilteredNFTs(token_metadata)
        setPending(false)
    }

    const handleSearch = () => {
        let tempNFTs = []
        /**Filter Network */
        if (filterNetwork.indexOf("ether") > -1 && filterNetwork.indexOf("bsc") > -1) {
            tempNFTs = nftTokens
        } else if (filterNetwork.indexOf("ether") > -1 && filterNetwork.indexOf("bsc") === -1) {
            tempNFTs = etherNFTs
        } else if (filterNetwork.indexOf("ether") === -1 && filterNetwork.indexOf("bsc") > -1) {
            tempNFTs = bscNFTs
        } else {
            tempNFTs = []
        }
        /**Filter Status */
        if (filterStatus.length === 3) {
            tempNFTs = tempNFTs
        } else if (filterStatus.length === 2 && filterStatus.indexOf("Sale") === -1) {
            tempNFTs = tempNFTs.filter(nft => (nft.listPrice === 0 && nft.highestOfferPrice > 0) || (nft.listPrice === 0 && nft.highestOfferPrice === 0))
        } else if (filterStatus.length === 2 && filterStatus.indexOf("Offer") === -1) {
            tempNFTs = tempNFTs.filter(nft => nft.listPrice > 0 || nft.highestOfferPrice === 0)
        } else if (filterStatus.length === 2 && filterStatus.indexOf("New") === -1) {
            tempNFTs = tempNFTs.filter(nft => nft.listPrice > 0 || nft.highestOfferPrice > 0)
        } else if (filterStatus.length === 1 && filterStatus.indexOf('Sale') > -1) {
            tempNFTs = tempNFTs.filter(nft => nft.listPrice > 0 && nft.highestOfferPrice === 0)
        } else if (filterStatus.length === 1 && filterStatus.indexOf('Offer') > -1) {
            tempNFTs = tempNFTs.filter(nft => nft.listPrice === 0 && nft.highestOfferPrice > 0)
        } else if (filterStatus.length === 1 && filterStatus.indexOf('New') > -1) {
            tempNFTs = tempNFTs.filter(nft => nft.listPrice === 0 && nft.highestOfferPrice === 0)
        } else {
            tempNFTs = []
        }
        /**Filter Token */
        if (filterToken.length === 3) {
            tempNFTs = tempNFTs
        } else if (filterToken.length === 2 && filterToken.indexOf('ether') === -1) {
            tempNFTs = tempNFTs.filter(nft => nft.network === 'bsc' && nft.listPrice > 0)
        } else if (filterToken.length === 2 && filterToken.indexOf('bsc') === -1) {
            tempNFTs = tempNFTs.filter(nft => (nft.network === 'ether' && nft.listPrice > 0) || (nft.network === 'bsc' && nft.listPrice > 0 && nft.listType === 2))
        } else if (filterToken.length === 2 && filterToken.indexOf('golf') === -1) {
            tempNFTs = tempNFTs.filter(nft => (nft.network === 'ether' && nft.listPrice > 0) || (nft.network === 'bsc' && nft.listPrice > 0 && nft.listType === 1))
        } else if (filterToken.length === 1 && filterToken.indexOf('ether') > -1) {
            tempNFTs = tempNFTs.filter(nft => nft.network === 'ether' && nft.listPrice > 0)
        } else if (filterToken.length === 1 && filterToken.indexOf('bsc') > -1) {
            tempNFTs = tempNFTs.filter(nft => nft.network === 'bsc' && nft.listPrice > 0 && nft.listType === 1)
        } else if (filterToken.length === 1 && filterToken.indexOf('golf') > -1) {
            tempNFTs = tempNFTs.filter(nft => nft.network === 'bsc' && nft.listPrice > 0 && nft.listType === 2)
        } else {
            tempNFTs = []
        }
        return tempNFTs;
    }

    const getMetaData = async (nfts, is_all) => {
        let token_id;
        let token_metadata = [];
        let filtered = await nfts.sort((a, b) => {
            return parseInt(b.listTime) - parseInt(a.listTime)
        })
        if (is_all) {
            setPagenum(1)
            filtered = await filtered.slice(0, 10000)
        } else {
            filtered = await filtered.slice((pagenum - 1) * pagesize, pagenum * pagesize)
        }
        for (let i = 0; i < filtered.length; i++) {
            try {
                token_id = filtered[i].token_id
                const res = await axios.get("https://cryptogolf.mypinata.cloud/ipfs/" + filtered[i].tokenURI.split("ipfs://")[1]);
                await token_metadata.push({
                    ...filtered[i],
                    image_original_url: "https://cryptogolf.mypinata.cloud/ipfs/" + res.data.image.split("ipfs://")[1],
                    name: res.data.name,
                    description: res.data.description,
                    dna: res.data.dna,
                    date: res.data.date,
                    class: res.data.attributes.filter(attr => attr.trait_type === 'Class').length > 0 ?
                        res.data.attributes.filter(attr => attr.trait_type === 'Class')[0].value : ''
                })
            } catch (err) {
                console.log("Error: ", err)
            }
        }
        if (isPrice && is_all) {
            setFilteredNFTs(token_metadata)
            setIsPrice(false)
        } else {
            setFilteredNFTs(filteredNFTs.concat(token_metadata))
        }
        setPending(false)
    }

    const handlePagination = async () => {
        setPending(true)
        let result = await handleSearch()
        const filteredResult = result.filter(res => res.listType === 2 ?
            (Number(res.listPrice) >= Number(minPrice) && Number(res.listPrice) >= Number(minPrice)) :
            (Number(Web3.utils.fromWei(String(res.listPrice), "ether")) >= Number(minPrice) && Number(Web3.utils.fromWei(String(res.listPrice), "ether")) <= Number(maxPrice))
        )
        console.log("2222222")
        getMetaData(filteredResult, false)
    }

    const handleFilterPrice = () => {
        setPending(true)
        const result = handleSearch()
        if (result.length > 0) {
            const filteredResult = result.filter(res => res.listType === 2 ?
                (Number(res.listPrice) >= Number(minPrice) && Number(res.listPrice) >= Number(minPrice)) :
                (Number(Web3.utils.fromWei(String(res.listPrice), "ether")) >= Number(minPrice) && Number(Web3.utils.fromWei(String(res.listPrice), "ether")) <= Number(maxPrice))
            )
            if (filteredResult.length > 0) {
                console.log("3333333")
                getMetaData(filteredResult, false)
            } else {
                setPending(false)
                setIsPrice(false)
                setFilteredNFTs([])
            }
        } else {
            setPending(false)
            setIsPrice(false)
            setFilteredNFTs([])
        }
    }

    const handleCopy = (e) => {
        e.stopPropagation()

        navigator.clipboard.writeText(walletAddress)
        setShow(true)
        setTimeout(() => {
            setShow(false)
        }, 3000)
    }

    const handleFilterNetwork = (key, val) => {
        setFilteredNFTs([])
        if (val) {
            if (filterNetwork.indexOf(key) === -1) {
                setFilterNetwork([...filterNetwork, key])
            }
        } else {
            if (filterNetwork.indexOf(key) > -1) {
                const data = filterNetwork.filter(i => i !== key)
                setFilterNetwork(data)
            }
        }
    }

    const handleFilterStatus = (key, val) => {
        setFilteredNFTs([])
        if (val) {
            if (filterStatus.indexOf(key) === -1) setFilterStatus([...filterStatus, key])
        } else {
            if (filterStatus.indexOf(key) > -1) {
                const data = filterStatus.filter(i => i !== key)
                setFilterStatus(data)
            }
        }
    }

    const handleFilterToken = (filterKey, val) => {
        setFilteredNFTs([])
        if (val) {
            if (filterToken.indexOf(filterKey) === -1) {
                setFilterToken([...filterToken, filterKey])
            }
        } else {
            if (filterToken.indexOf(filterKey) > -1) {
                const filtered = filterToken.filter(prop => prop !== filterKey)
                setFilterToken(filtered)
            }
        }
    }

    const handleFilterProperty = (filterKey, val) => {
        if (val) {
            if (filterProperty.indexOf(filterKey) === -1) {
                setFilterProperty([...filterProperty, filterKey])
            }
        } else {
            if (filterProperty.indexOf(filterKey) > -1) {
                const filtered = filterProperty.filter(prop => prop !== filterKey)
                setFilterProperty(filtered)
            }
        }
    }

    const handleChangeSlide = (val) => {
        setMinPrice(val[0])
        setMaxPrice(val[1])
    }

    const handleCloseProfileModal = () => {
        setShowProfileModal(false)
    }

    const handleRefresh = () => {
        if (walletAddress !== null && !pending) {
            setPagenum(1)
            getAllTokenData()
        }
    }

    const handleSearchID = async () => {
        if (walletAddress !== null && (chainId === 1 || chainId === 3 || chainId === 56 || chainId === 97)) {
            if (searchID === "") {
                setPagenum(1)
                getAllTokenData()
            } else {
                if (!isNaN(searchID)) {
                    let token_metadata = []
                    let token_id;
                    let metadata;
                    let loop = 0;
                    const filteredData = nftTokens.filter(nft => Number(nft.token_id) === Number(searchID))
                    if (filteredData.length === 0) {
                        setFilteredNFTs([])
                        return;
                    }
                    await Promise.all(filteredData.map(async (token) => {
                        loop++;
                        token_id = token.tokenURI.split("ipfs://")[1].split("/")[1].split(".json")[0];
                        metadata = await axios.get("https://cryptogolf.mypinata.cloud/ipfs/" + token.tokenURI.split("ipfs://")[1])
                        await token_metadata.push({
                            ...token,
                            image_original_url: "https://cryptogolf.mypinata.cloud/ipfs/" + metadata.data.image.split("ipfs://")[1],
                            name: metadata.data.name,
                            description: metadata.data.description,
                            dna: metadata.data.dna,
                            date: metadata.data.date,
                            class: metadata.data.attributes.filter(attr => attr.trait_type === 'Class').length > 0 ?
                                metadata.data.attributes.filter(attr => attr.trait_type === 'Class')[0].value : ''
                        })
                    }))
                    setFilteredNFTs(token_metadata)
                }
            }
        }
    }

    const handleSort = () => {
        switch (sortKey) {
            case "Listed":
                dropdown_text.current.innerText = "Recently Listed"
                setFilteredNFTs([
                    ...filteredNFTs.sort((a, b) => {
                        return parseInt(b.listTime) - parseInt(a.listTime)
                    })
                ])
                setSorted(false)
                break;
            case "Sold":
                dropdown_text.current.innerText = "Recently Sold"
                setFilteredNFTs([
                    ...filteredNFTs.sort((a, b) => {
                        return parseInt(b.lastSoldTime) - parseInt(a.lastSoldTime)
                    })
                ])
                setSorted(false)
                break;
            case "LH":
                dropdown_text.current.innerText = "Price (Lowest to highest)"
                setFilteredNFTs([
                    ...filteredNFTs.sort((a, b) => {
                        return parseFloat(a.listPrice) - parseFloat(b.listPrice)
                    })
                ])
                setSorted(false)
                break;
            case "HL":
                dropdown_text.current.innerText = "Price (Highest to lowest)"
                setFilteredNFTs([
                    ...filteredNFTs.sort((a, b) => {
                        return parseFloat(b.listPrice) - parseFloat(a.listPrice)
                    })
                ])
                setSorted(false)
                break;
            case "Sale":
                dropdown_text.current.innerText = "Highest Last Sale"
                setFilteredNFTs([
                    ...filteredNFTs.sort((a, b) => {
                        return parseFloat(b.lastSoldPrice) - parseFloat(a.lastSoldPrice)
                    })
                ])
                setSorted(false)
                break;
            default:
                break;
        }
    }

    const handleScroll = (e) => {
        const bottom = e.target.scrollHeight - e.target.scrollTop === e.target.clientHeight;
        if (bottom && filteredNFTs.length < nftTokens.length) {
            let temp = pagenum;
            temp = temp + 1;
            setPagenum(temp);
        }
    }

    // const handleShowAll = async (val) => {
    //     if (val) {
    //         setFilteredNFTs([])
    //         const filteredResult = await nftTokens.filter(res => res.listType === 2 ?
    //             (Number(res.listPrice) >= 0 && Number(res.listPrice) >= 0) :
    //             (Number(Web3.utils.fromWei(String(res.listPrice), "ether")) >= 0 && Number(Web3.utils.fromWei(String(res.listPrice), "ether")) <= 100)
    //         )
    //         getMetaData(filteredResult, true)
    //     } else {
    //         setFilteredNFTs([])
    //         const result = await handleSearch()
    //         const filteredResult = await result.filter(res => res.listType === 2 ?
    //             (Number(res.listPrice) >= Number(minPrice) && Number(res.listPrice) >= Number(minPrice)) :
    //             (Number(Web3.utils.fromWei(String(res.listPrice), "ether")) >= Number(minPrice) && Number(Web3.utils.fromWei(String(res.listPrice), "ether")) <= Number(maxPrice))
    //         )
    //         getMetaData(filteredResult, false)
    //     }
    // }

    return (
        <Styles>
            {
                Object.keys(nftTokens).length > 0 && (
                    <ProfileModal
                        show={showProfileModal}
                        handleClose={handleCloseProfileModal}
                        walletAddress={walletAddress}
                        user={user}
                    />
                )
            }
            <div className="container color-grey">
                <Row>
                    <Col className="page_content col-lg-12 col-12">
                        <div className="border-grey p-1">
                            <div className="row">
                                <div className="col-lg-7 col-12 d-flex align-items-center justify-content-center">
                                    <InputGroup>
                                        <InputGroup.Text className="background-transparent border-grey color-grey font-small"><FaSearch /></InputGroup.Text>
                                        <FormControl
                                            onChange={(e) => setSearchID(e.target.value)}
                                            className="background-transparent border-grey color-white font-small"
                                            placeholder="Search ID"
                                            size="sm"
                                            value={searchID}
                                        />
                                    </InputGroup>
                                    <Button
                                        variant="link"
                                        className="navbar-toggler color-white toggle-btn ml-4 background-transparent"
                                        onClick={() => setShowNavFilter(!showNavFilter)}
                                    >
                                        <FaBars />
                                    </Button>
                                </div>
                                <div className="col-lg-3 col-12 d-flex align-items-center justify-content-end px-1 desktop-menu">
                                    <Dropdown align="end" className="mx-2">
                                        <Dropdown.Toggle variant="primary" ref={sortMenuRef} className="background-transparent">
                                            <span ref={dropdown_text}>Recently Listed</span> <IoIosArrowDown />
                                        </Dropdown.Toggle>

                                        <Dropdown.Menu className="mt-2">
                                            <Dropdown.Item className="text-left color-grey" onClick={() => {
                                                setSorted(true)
                                                setSortKey("Listed")
                                            }}>Recently Listed</Dropdown.Item>
                                            <Dropdown.Item className="text-left color-grey" onClick={() => {
                                                setSorted(true)
                                                setSortKey("Sold")
                                            }}>Recently Sold</Dropdown.Item>
                                            <Dropdown.Item className="text-left color-grey" onClick={() => {
                                                setSorted(true)
                                                setSortKey("LH")
                                            }}>Price (Lowest to highest)</Dropdown.Item>
                                            <Dropdown.Item className="text-left color-grey" onClick={() => {
                                                setSorted(true)
                                                setSortKey("HL")
                                            }}>Price (Highest to lowest)</Dropdown.Item>
                                            <Dropdown.Item className="text-left color-grey" onClick={() => {
                                                setSorted(true)
                                                setSortKey("Sale")
                                            }}>Highest Last Sale</Dropdown.Item>
                                        </Dropdown.Menu>
                                    </Dropdown>
                                    <span>|</span>
                                    <div className="mx-2 color-grey">
                                        <MdRefresh className="cursor-pointer" onClick={handleRefresh} />
                                    </div>
                                </div>
                                <div className="col-lg-2 col-12 d-flex align-items-center p-0 text-center desktop-menu">
                                    {
                                        walletAddress === null ? (
                                            <div className="m-auto font-very-small">Not Connected</div>
                                        ) : (
                                            <Dropdown align="end" className="m-auto">
                                                <Dropdown.Toggle variant="primary" id="dropdown-basic" className="background-transparent font-small d-flex align-items-center">
                                                    {
                                                        Object.keys(user).length > 0 ? (
                                                            <img className="circle-image" src={user.avatar !== "" ? `${process.env.REACT_APP_API_URL}upload/${user.avatar}` : Avatar} alt="" width="20px" />
                                                        ) : (
                                                            <img className="circle-image" src={Avatar} alt="" width="20px" />
                                                        )
                                                    }
                                                    {
                                                        Object.keys(user).length > 0 && user?.name !== "" ? (
                                                            <span className="font-small color-grey bold"> &nbsp;{user?.name}</span>
                                                        ) : (
                                                            <span>
                                                                {walletAddress && `${walletAddress.slice(0, 6)}...${walletAddress.slice(
                                                                    walletAddress.length - 4,
                                                                    walletAddress.length
                                                                )}`}
                                                            </span>
                                                        )
                                                    }
                                                    <FaCaretDown className="ml-2" />
                                                </Dropdown.Toggle>

                                                <Dropdown.Menu className="mt-2">
                                                    <Dropdown.Item className="text-left color-grey bold cursor-intitial" onClick={(e) => e.stopPropagation()}>
                                                        Connected
                                                    </Dropdown.Item>
                                                    <Dropdown.Item className="text-left color-grey my-1 d-flex align-items-center justify-content-between cursor-intitial">
                                                        <div className="d-flex align-items-center justify-content-center">
                                                            {
                                                                Object.keys(user).length > 0 ? (
                                                                    <img className="circle-image" src={user.avatar !== "" ? `${process.env.REACT_APP_API_URL}upload/${user.avatar}` : Avatar} alt="" width="20px" />
                                                                ) : (
                                                                    <img className="circle-image" src={Avatar} alt="" width="20px" />
                                                                )
                                                            }
                                                            {
                                                                (Object.keys(user).length > 0 && user.name !== "") ? (
                                                                    <div>
                                                                        <span className="cursor-pointer font-very-small bold color-grey" onClick={(e) => e.stopPropagation()}>&nbsp;{user.name}</span>
                                                                        <br />
                                                                        <span className="font-very-small mt-1">{walletAddress && `${walletAddress.slice(0, 6)}...${walletAddress.slice(
                                                                            walletAddress.length - 4,
                                                                            walletAddress.length
                                                                        )}`}</span>
                                                                    </div>
                                                                ) : (
                                                                    <div>
                                                                        <span className="font-very-small">{walletAddress && `${walletAddress.slice(0, 6)}...${walletAddress.slice(
                                                                            walletAddress.length - 4,
                                                                            walletAddress.length
                                                                        )}`}</span>
                                                                        <br />
                                                                        <span
                                                                            className="cursor-pointer mt-1"
                                                                            style={{ fontSize: '11px', color: '#5ef5a1' }}
                                                                            onClick={(e) => setShowProfileModal(true)}
                                                                        >Set display name</span>
                                                                    </div>
                                                                )
                                                            }
                                                        </div>
                                                        <Button
                                                            ref={target}
                                                            variant="outline-primary"
                                                            className="background-transparent border-none"
                                                            onClick={handleCopy}
                                                        >
                                                            <FaCopy className="color-grey text-right cursor-pointer" />
                                                        </Button>
                                                        <Overlay target={target.current} show={show} placement="bottom">
                                                            {(props) => (
                                                                <Tooltip className="font-very-small" id="overlay-example" {...props}>
                                                                    Copied
                                                                </Tooltip>
                                                            )}
                                                        </Overlay>
                                                    </Dropdown.Item>
                                                    <Dropdown.Item
                                                        className="text-left color-grey"
                                                        onClick={() => history.push(`/account`)}
                                                    >My Account</Dropdown.Item>
                                                    <Dropdown.Item
                                                        className="text-left w-100 text-decoration-none color-white"
                                                        onClick={() => history.push(`/users/${walletAddress}`)}
                                                    >
                                                        My NFT
                                                    </Dropdown.Item>
                                                    <Dropdown.Item className="text-left color-grey" onClick={(e) => setShowProfileModal(true)}>Preferences</Dropdown.Item>
                                                    <Dropdown.Item className="btn btn-primary color-black mt-1" variant="primary" onClick={handleExit}>
                                                        Exit
                                                    </Dropdown.Item>
                                                </Dropdown.Menu>
                                            </Dropdown>
                                        )
                                    }
                                </div>
                            </div>
                            <div className="row">
                            </div>
                        </div>
                    </Col>
                    <Col className="col-lg-12 col-12 text-left">
                        <div className="border-grey">
                            <Row className="mx-0">
                                <Col lg={3} xs={12} className="desktop-menu border-right-grey p-2">
                                    <div>
                                        <BiFilter />&nbsp;Filter
                                        <div className="mt-4">
                                            <h6>Network</h6>
                                            <Form.Check
                                                type='checkbox'
                                                label=' Ethereum'
                                                className="filter-net d-flex align-items-center"
                                                onChange={(e) => {
                                                    setPagenum(1)
                                                    handleFilterNetwork('ether', e.target.checked)
                                                }}
                                                checked={filterNetwork.indexOf('ether') > -1}
                                            />
                                            <Form.Check
                                                type='checkbox'
                                                label=' Binance Smart Chain'
                                                className="filter-net d-flex align-items-center"
                                                onChange={(e) => {
                                                    setPagenum(1)
                                                    handleFilterNetwork('bsc', e.target.checked)
                                                }}
                                                checked={filterNetwork.indexOf('bsc') > -1}
                                            />
                                        </div>
                                        <div className="mt-4">
                                            <h6>Status</h6>
                                            <Form.Check
                                                type='checkbox'
                                                label=' On Sale'
                                                className="filter-net d-flex align-items-center"
                                                onChange={(e) => {
                                                    setPagenum(1)
                                                    handleFilterStatus('Sale', e.target.checked)
                                                }}
                                                checked={filterStatus.indexOf('Sale') > -1}
                                            />
                                            <Form.Check
                                                type='checkbox'
                                                label=' Has Offers'
                                                className="filter-net d-flex align-items-center"
                                                onChange={(e) => {
                                                    setPagenum(1)
                                                    handleFilterStatus('Offer', e.target.checked)
                                                }}
                                                checked={filterStatus.indexOf('Offer') > -1}
                                            />
                                            <Form.Check
                                                type='checkbox'
                                                label=' New'
                                                className="filter-net d-flex align-items-center"
                                                onChange={(e) => {
                                                    setPagenum(1)
                                                    handleFilterStatus('New', e.target.checked)
                                                }}
                                                checked={filterStatus.indexOf('New') > -1}
                                            />
                                            {/* <Form.Check
                                                type='checkbox'
                                                label=' Show All'
                                                className="filter-net d-flex align-items-center"
                                                onChange={(e) => {
                                                    handleShowAll(e.target.checked)
                                                }}
                                            /> */}
                                        </div>
                                        <div className="mt-4">
                                            <h6 className="d-flex justify-content-between align-items-center">
                                                <span>Price</span>
                                                <button
                                                    className="btn btn-outline-primary border-grey color-grey background-transparent"
                                                    onClick={(e) => {
                                                        setPagenum(1)
                                                        setFilteredNFTs([])
                                                        setIsPrice(true)
                                                    }}
                                                >
                                                    <FaSearch className="font-very-small" />
                                                </button>
                                            </h6>
                                            <RangeSlider onSliderChange={handleChangeSlide} />
                                        </div>
                                        <hr />
                                        <div className="font-very-small d-flex">
                                            <Form.Check
                                                type='checkbox'
                                                label=""
                                                className="filter-net d-flex align-items-center"
                                                onChange={(e) => handleFilterToken('ether', e.target.checked)}
                                                checked={filterToken.indexOf('ether') > -1}
                                            />
                                            <img src={EthImg} height="20px" alt="" />&nbsp;&nbsp;ETH
                                        </div>
                                        <div className="font-very-small d-flex my-2">
                                            <Form.Check
                                                type='checkbox'
                                                label=""
                                                className="filter-net d-flex align-items-center"
                                                onChange={(e) => handleFilterToken('bsc', e.target.checked)}
                                                checked={filterToken.indexOf('bsc') > -1}
                                            />
                                            <img src={BscImg} height="20px" alt="" />&nbsp;BNB (BSC)
                                        </div>
                                        <div className="font-very-small d-flex">
                                            <Form.Check
                                                type='checkbox'
                                                label=""
                                                className="filter-net d-flex align-items-center"
                                                onChange={(e) => handleFilterToken('golf', e.target.checked)}
                                                checked={filterToken.indexOf('golf') > -1}
                                            />
                                            <img src={GolfImg} height="20px" alt="" />&nbsp;GOLF
                                        </div>
                                        <div className="my-4">
                                            <h6>Class</h6>
                                            <Form.Check
                                                type='checkbox'
                                                label=' PRO'
                                                className="filter-net d-flex align-items-center"
                                                onChange={(e) => handleFilterProperty('PRO', e.target.checked)}
                                                checked={filterProperty.indexOf('PRO') > -1}
                                            />
                                            <Form.Check
                                                type='checkbox'
                                                label=' BREAK 70'
                                                className="filter-net d-flex align-items-center"
                                                onChange={(e) => handleFilterProperty('Break 70', e.target.checked)}
                                                checked={filterProperty.indexOf('Break 70') > -1}
                                            />
                                            <Form.Check
                                                type='checkbox'
                                                label=' BREAK 80'
                                                className="filter-net d-flex align-items-center"
                                                onChange={(e) => handleFilterProperty('Break 80', e.target.checked)}
                                                checked={filterProperty.indexOf('Break 80') > -1}
                                            />
                                            <Form.Check
                                                type='checkbox'
                                                label=' Break 90 '
                                                className="filter-net d-flex align-items-center"
                                                onChange={(e) => handleFilterProperty('Break 90 ', e.target.checked)}
                                                checked={filterProperty.indexOf('Break 90 ') > -1}
                                            />
                                            <Form.Check
                                                type='checkbox'
                                                label=' BREAK 100'
                                                className="filter-net d-flex align-items-center"
                                                onChange={(e) => handleFilterProperty('Break 100', e.target.checked)}
                                                checked={filterProperty.indexOf('Break 100') > -1}
                                            />
                                        </div>
                                    </div>
                                </Col>
                                <Col lg={9} xs={12} className="p-3 position-relative nft-cards" onScroll={handleScroll}>
                                    {
                                        pending && <div
                                            style={{
                                                position: 'absolute',
                                                width: "100%",
                                                height: "90%",
                                                minHeight: "400px",
                                                display: "flex",
                                                justifyContent: "center",
                                                alignItems: "center",
                                                zIndex: '99999'
                                            }}
                                        >
                                            <Loader type="ThreeDots" color="green" height="200px" width="100" />
                                        </div>
                                    }
                                    <Row className="mx-2">
                                        {
                                            Object.keys(filteredNFTs).length > 0 ? (
                                                filteredNFTs.filter(t => filterProperty.indexOf(t.class) > -1)
                                                    .map((data, index) => (
                                                        <Col lg="3" xs="6" className="px-1 my-1 float-left" key={index}>
                                                            <Link className="text-decoration-none" to={`assets/${data.network}/${data.network === 'ether' ? EthereumContractAddress : BinanceContractAddress}/${data.token_id}`}>
                                                                <MarketCard
                                                                    wallet={walletAddress}
                                                                    data={data}
                                                                    tokenName={tokenName}
                                                                    ethPrice={ethPrice}
                                                                    bscPrice={bscPrice}
                                                                />
                                                            </Link>
                                                        </Col>
                                                    ))
                                            ) : <div></div>
                                        }
                                    </Row>
                                    {
                                        showNavFilter && (
                                            <Row className="w-75 mobile-filters p-3">
                                                <Col>
                                                    <div>
                                                        {
                                                            walletAddress === null ? (
                                                                <div className="m-auto font-very-small">Not Connected</div>
                                                            ) : (
                                                                <>
                                                                    <div className="d-flex justify-content-between my-2">
                                                                        <div className="d-flex align-items-center justify-content-center">
                                                                            {
                                                                                Object.keys(user).length > 0 ? (
                                                                                    <img className="circle-image" src={user.avatar !== "" ? `${process.env.REACT_APP_API_URL}upload/${user.avatar}` : Avatar} alt="" width="30px" />
                                                                                ) : (
                                                                                    <img className="circle-image" src={Avatar} alt="" width="30px" />
                                                                                )
                                                                            }
                                                                            {
                                                                                (Object.keys(user).length > 0 && user.name !== "") ? (
                                                                                    <div>
                                                                                        <span className="cursor-pointer font-very-small bold color-grey" onClick={(e) => e.stopPropagation()}>&nbsp;{user.name}</span>
                                                                                        <br />
                                                                                        <span className="font-very-small mt-1">{walletAddress && `${walletAddress.slice(0, 6)}...${walletAddress.slice(
                                                                                            walletAddress.length - 4,
                                                                                            walletAddress.length
                                                                                        )}`}</span>
                                                                                    </div>
                                                                                ) : (
                                                                                    <div>
                                                                                        <span className="font-very-small">{walletAddress && `${walletAddress.slice(0, 6)}...${walletAddress.slice(
                                                                                            walletAddress.length - 4,
                                                                                            walletAddress.length
                                                                                        )}`}</span>
                                                                                        <br />
                                                                                        <span
                                                                                            className="cursor-pointer mt-1"
                                                                                            style={{ fontSize: '11px', color: '#5ef5a1' }}
                                                                                            onClick={(e) => setShowProfileModal(true)}
                                                                                        >Set display name</span>
                                                                                    </div>
                                                                                )
                                                                            }
                                                                        </div>
                                                                        <Button
                                                                            ref={target}
                                                                            variant="outline-primary"
                                                                            className="background-transparent border-none"
                                                                            onClick={handleCopy}
                                                                        >
                                                                            <FaCopy className="color-grey text-right cursor-pointer" />
                                                                        </Button>
                                                                        <Overlay target={target.current} show={show} placement="bottom">
                                                                            {(props) => (
                                                                                <Tooltip className="font-very-small" id="overlay-example" {...props}>
                                                                                    Copied
                                                                                </Tooltip>
                                                                            )}
                                                                        </Overlay>
                                                                    </div>
                                                                    <div className="color-grey my-3" onClick={() => history.push(`/account`)}>My Account</div>
                                                                    <div className="color-grey my-3" onClick={() => history.push(`/users/${walletAddress}`)}>
                                                                        My NFT
                                                                    </div>
                                                                    <div className="color-grey my-3" onClick={(e) => setShowProfileModal(true)}>Preferences</div>
                                                                    <button className="btn btn-primary color-white w-100" variant="primary" onClick={handleExit}>
                                                                        Exit
                                                                    </button>
                                                                </>
                                                            )
                                                        }
                                                    </div>
                                                    <hr className="background-white" />
                                                    <div>
                                                        <BiFilter />&nbsp;Filter
                                                        <div className="mt-4">
                                                            <h6>Network</h6>
                                                            <Form.Check
                                                                type='checkbox'
                                                                label=' Ethereum'
                                                                className="filter-net d-flex align-items-center"
                                                                onChange={(e) => {
                                                                    setPagenum(1)
                                                                    setShowNavFilter(false)
                                                                    handleFilterNetwork('ether', e.target.checked)
                                                                }}
                                                                checked={filterNetwork.indexOf('ether') > -1}
                                                            />
                                                            <Form.Check
                                                                type='checkbox'
                                                                label=' Binance Smart Chain'
                                                                className="filter-net d-flex align-items-center"
                                                                onChange={(e) => {
                                                                    setPagenum(1)
                                                                    setShowNavFilter(false)
                                                                    handleFilterNetwork('bsc', e.target.checked)
                                                                }}
                                                                checked={filterNetwork.indexOf('bsc') > -1}
                                                            />
                                                        </div>
                                                        <div className="mt-4">
                                                            <h6>Status</h6>
                                                            <Form.Check
                                                                type='checkbox'
                                                                label=' On Sale'
                                                                className="filter-net d-flex align-items-center"
                                                                onChange={(e) => {
                                                                    setPagenum(1)
                                                                    setShowNavFilter(false)
                                                                    handleFilterStatus('Sale', e.target.checked)
                                                                }}
                                                                checked={filterStatus.indexOf('Sale') > -1}
                                                            />
                                                            <Form.Check
                                                                type='checkbox'
                                                                label=' Has Offers'
                                                                className="filter-net d-flex align-items-center"
                                                                onChange={(e) => {
                                                                    setPagenum(1)
                                                                    setShowNavFilter(false)
                                                                    handleFilterStatus('Offer', e.target.checked)
                                                                }}
                                                                checked={filterStatus.indexOf('Offer') > -1}
                                                            />
                                                            <Form.Check
                                                                type='checkbox'
                                                                label=' New'
                                                                className="filter-net d-flex align-items-center"
                                                                onChange={(e) => {
                                                                    setPagenum(1)
                                                                    setShowNavFilter(false)
                                                                    handleFilterStatus('New', e.target.checked)
                                                                }}
                                                                checked={filterStatus.indexOf('New') > -1}
                                                            />
                                                        </div>
                                                        <div className="mt-4">
                                                            <h6 className="d-flex justify-content-between">
                                                                Price
                                                                <button
                                                                    className="btn btn-outline-primary font-very-small border-grey color-grey background-transparent"
                                                                    onClick={(e) => {
                                                                        setPagenum(1)
                                                                        setShowNavFilter(false)
                                                                        setFilteredNFTs([])
                                                                        setIsPrice(true)
                                                                    }}
                                                                >
                                                                    <FaSearch />
                                                                </button>
                                                            </h6>
                                                            <RangeSlider onSliderChange={handleChangeSlide} />
                                                        </div>
                                                        <hr />
                                                        <div className="font-very-small d-flex">
                                                            <Form.Check
                                                                type='checkbox'
                                                                label=""
                                                                className="filter-net d-flex align-items-center"
                                                                onChange={(e) => handleFilterToken('ether', e.target.checked)}
                                                                checked={filterToken.indexOf('ether') > -1}
                                                            />
                                                            <img src={EthImg} height="20px" alt="" />&nbsp;&nbsp;ETH
                                                        </div>
                                                        <div className="font-very-small d-flex">
                                                            <Form.Check
                                                                type='checkbox'
                                                                label=""
                                                                className="filter-net d-flex align-items-center"
                                                                onChange={(e) => handleFilterToken('bsc', e.target.checked)}
                                                                checked={filterToken.indexOf('bsc') > -1}
                                                            />
                                                            <img src={BscImg} height="20px" alt="" />&nbsp;BNB (BSC)
                                                        </div>
                                                        <div className="font-very-small d-flex">
                                                            <Form.Check
                                                                type='checkbox'
                                                                label=""
                                                                className="filter-net d-flex align-items-center"
                                                                onChange={(e) => handleFilterToken('golf', e.target.checked)}
                                                                checked={filterToken.indexOf('golf') > -1}
                                                            />
                                                            <img src={GolfImg} height="20px" alt="" />&nbsp;GOLF
                                                        </div>
                                                        <div className="my-4">
                                                            <h6>Class</h6>
                                                            <Form.Check
                                                                type='checkbox'
                                                                label=' PRO'
                                                                className="filter-net d-flex align-items-center"
                                                                onChange={(e) => {
                                                                    setShowNavFilter(false)
                                                                    handleFilterProperty('PRO', e.target.checked)
                                                                }}
                                                                checked={filterProperty.indexOf('PRO') > -1}
                                                            />
                                                            <Form.Check
                                                                type='checkbox'
                                                                label=' BREAK 70'
                                                                className="filter-net d-flex align-items-center"
                                                                onChange={(e) => {
                                                                    setShowNavFilter(false)
                                                                    handleFilterProperty('Break 70', e.target.checked)
                                                                }}
                                                                checked={filterProperty.indexOf('Break 70') > -1}
                                                            />
                                                            <Form.Check
                                                                type='checkbox'
                                                                label=' BREAK 80'
                                                                className="filter-net d-flex align-items-center"
                                                                onChange={(e) => {
                                                                    setShowNavFilter(false)
                                                                    handleFilterProperty('Break 80', e.target.checked)
                                                                }}
                                                                checked={filterProperty.indexOf('Break 80') > -1}
                                                            />
                                                            <Form.Check
                                                                type='checkbox'
                                                                label=' Break 90 '
                                                                className="filter-net d-flex align-items-center"
                                                                onChange={(e) => {
                                                                    setShowNavFilter(false)
                                                                    handleFilterProperty('Break 90 ', e.target.checked)
                                                                }}
                                                                checked={filterProperty.indexOf('Break 90 ') > -1}
                                                            />
                                                            <Form.Check
                                                                type='checkbox'
                                                                label=' BREAK 100'
                                                                className="filter-net d-flex align-items-center"
                                                                onChange={(e) => {
                                                                    setShowNavFilter(false)
                                                                    handleFilterProperty('Break 100', e.target.checked)
                                                                }}
                                                                checked={filterProperty.indexOf('Break 100') > -1}
                                                            />
                                                        </div>
                                                    </div>
                                                </Col>
                                            </Row>
                                        )
                                    }
                                </Col>
                            </Row>
                        </div>
                    </Col>
                </Row>
            </div>
        </Styles>
    )
}

export default MarketPlace;