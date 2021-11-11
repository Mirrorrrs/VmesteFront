let App = new Vue({
    el: "#app",
    data: {
        web3Provider: null,
        apiHost: "http://127.0.0.1:8000/",
        contracts: {},
        account: undefined,
        contractsKeysArray: ["Vmeste"],
        appOwner: "0x400979eD00Be37e316008d40a18c59E158113F53",
        instances: {},
        router: localStorage.getItem("applicationRoute") || "index",
        items: [],
        userInstace: {},
        userTickets:[],
        newUserName:"",
        newDescription:"",
        eventName:"",
        eventDescription:"",
        eventAddress:"",
        eventTime:"",
        eventValue:"",
        eventCount:"",
        prf: 'profile',
        modal:{
            index:20,
            name:",s,s,",
            time:3298209,
            address:"sdijfoais",
            description:"ojkdfosk",
            value:200,
            ticketsLeft:0
        },
    },

    created(){
        document.querySelector(".index").style.display = "block"

    },

    mounted() {
        if(this.router == "events"){
            this.getLiveEvents()

        }



        this.init()
    },

    methods: {
        changeRouteState(state) {
            console.log(state);
            if (state=="events"){
                this.getLiveEvents()
            }
            if(state=="profile"){
                if(this.account){
                    this.getUserInstance()
                    this.getTickets()



                }else{
                    this.router = "index"
                    localStorage.setItem("applicationRoute", this.router)
                    return
                }
            }

            this.router = state
            localStorage.setItem("applicationRoute", this.router)
        },

        init: function () {
            return this.initWeb3();
        },
        toggleMenu(){
            console.log("some text")
            let menu = document.querySelector(".header__inner__nav")

            if(menu.style.height!="0px"){
                menu.style.height = "0"

            }else{
                menu.style.height = "fit-content"

            }
        },

        initWeb3: function () {
            if (typeof (web3) != "undefined") {
                this.web3Provider = web3.currentProvider
                web3 = new Web3(web3.currentProvider);
            } else {
                this.web3Provider = new Web3.providers.HttpProvider('http://127.0.0.1:8545');
                web3 = new Web3(this.web3Provider);
            }
            web3.eth.defaultAccount

            return this.initContracts(this.contractsKeysArray);
        },



        initContracts: function (contracts) {
            contracts.forEach(el => {
                $.getJSON(el + ".json", function (election) {
                    App.contracts[el] = TruffleContract(election);
                    App.contracts[el].setProvider(App.web3Provider);
                });
            })

            this.getAccount(()=>{
                if(this.router=="profile"){
                    if(this.account){
                        this.getUserInstance()

                    }else{
                        this.changeRouteState("index")
                    }
                }
            })

        },
        //
        // bindEvents: function () {
        //     App.contracts.Election.deployed().then(instance=>{
        //       instance.customEvent()({},{
        //         from_block:"latest",
        //         to_block:"latest"
        //       }).watch(function (err,ev){
        //         App.render()
        //       })
        //     })
        //
        //     App.contracts.Election.deployed().then(instance=>{
        //       instance.customEvent2({},{
        //         from_block:"latest",
        //         to_block:"latest"
        //       }).watch(function (err,ev){
        //         App.render()
        //       })
        //     })
        // },

        getAccount: function (f) {
           web3.eth.getCoinbase(function (err, account) {
                if (err === null) {
                    App.account = account;
                    web3.eth.defaultAccount = App.appOwner
                    f()
                }
            });

        },

        getUserInstance: function (){
            $.ajax({
                url: this.apiHost + "api/getUser",
                method: "GET",
                data: {
                    userHash: this.account
                },
                success: (resp) => {
                    this.userInstace = resp
                }
            })
        },

        updateProfile:function (){
            $.ajax({
                url: this.apiHost + "api/updateUserProfile",
                method: "POST",
                data: {
                    userHash: this.account,
                    name:this.newUserName,
                    info:this.newDescription,
                    avatarURL:""
                },
                success: (resp) => {
                    this.getUserInstance()
                }
            })
        },

        login: function () {
            if(!this.account){
                ethereum.request({method: 'eth_requestAccounts'}).then(() => {
                    this.getAccount(()=>{
                        $.ajax({
                            url: App.apiHost + "api/login",
                            method: "POST",
                            data: {
                                userHash: App.account
                            },
                            success: (res) => {
                                this.getUserInstance()
                            }
                        })
                    })
                })
            }else{
                this.changeRouteState("events")
            }


        },

        generateQr:async function (num) {
            let qrArr = []
            for(let i=0; i<num; i++){
                let qrHash = sha256(random('lowernumeric'));
                let qrcode = new QRCode("qrCode", {
                    text:qrHash ,
                    width: 236,
                    height: 236,
                    colorDark: "#000000",
                    colorLight: "#ffffff",
                    correctLevel: QRCode.CorrectLevel.H
                });
               await html2canvas(document.querySelector("#qrCode")).then(canvas => {
                    let dataURL = canvas.toDataURL("image/jpeg");
                   let file = this.dataUrlToFile(dataURL, "ticket.jpg")
                    qrArr[qrHash]=file
                })
                document.querySelector("#qrCode").innerHTML = ""

            }
            return qrArr

        },

        dataUrlToFile: function (dataurl, filename) {
            var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
                bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
            while (n--) {
                u8arr[n] = bstr.charCodeAt(n);
            }
            return new File([u8arr], filename, {type: mime});
        },

        deployNFT:async function (arr, f) {
            let formData = new FormData
            for(let el of Object.keys(arr)){
                formData.append(el,arr[el])
            }
            let pr = new Promise((res,rej)=>{
                $.ajax({
                    url: App.apiHost + "api/uploadNFT",
                    method: "POST",
                    processData: false,
                    contentType: false,
                    data: formData,
                    success:(result) => {
                        res(result)
                    }
                })
            })
            return await pr


        },

        getUser: function () {

        },

        getReviews: function () {

        },

        getLiveEvents: function () {
            $.ajax({
                url: this.apiHost + "api/getLiveEvents",
                method: "GET",
                success: (res) => {
                    App.items = res
                }
            })
        },

        buyTicket: function (id,value){
            this.contracts.Vmeste.deployed().then(instance=>{
                    let val = value * Math.pow(10,18)
                    instance.buyTicket(id,{from:App.account, value:val})
            })
        },

        getTickets: function (){
            $.ajax({
                url: App.apiHost + "api/getTickets",
                method: "GET",
                data:{
                    userHash: App.account,
                },
                success: (res) => {
                    App.userTickets = res
                }
            })
        },

        closeModal: function (){
            document.querySelector("#modal").style.display = "none"

        },

        callModal:function (evArr,id){
            this.modal.name = evArr[5]
            this.modal.time = evArr[10]
            this.modal.address = evArr[4]
            this.modal.description = evArr[5]
            this.modal.value = evArr[7]/Math.pow(10,18)
            this.modal.index = id
            this.modal.ticketsLeft = evArr[9]
            document.querySelector("#modal").style.display = "block"
        },

        createEvent: function () {
            this.generateQr(1).then((data)=>{
                let verifyHash = Object.keys(data)
                this.deployNFT(data).then( (hashes)=>{
                    let hs = hashes.map(el=>el.ipnft)
                    $.ajax({
                        url: App.apiHost + "api/createEvent",
                        method: "POST",
                        data: {
                            userHash: App.account,
                            ticketsCount: App.eventCount,
                            x: Math.round(_coords[0] * Math.pow(10, 10)),
                            y: Math.round(_coords[1] * Math.pow(10, 10)),
                            timeStart: new Date(App.eventTime).getTime(),
                            eventName: App.eventName,
                            address: App.eventAddress,
                            description: App.eventDescription,
                            imageURL: "dosfkoidjoijsa",
                            ticketPrice:App.eventValue * Math.pow(10, 18),
                            ticketsNFTHash: hs,
                            verifyHash:verifyHash,
                            verify: false,
                        },
                        success: () => {
                        }
                    })
                })
            })










        }

    }
})

