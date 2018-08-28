const Sequelize = require('./model').Sequelize;
const sequelize = require('./model').sequelize;

const createdAt = {
    type: Sequelize.DATE,
    defaultValue: Sequelize.NOW,
    field: "created_at",
    get() {
        return getDate.call(this, 'createdAt'); 
    }
}

const updatedAt = {
    type: Sequelize.DATE,
    field: "updated_at",
    get() {
        return getDate.call(this, 'updatedAt');
    }
}

function getDate(field, tz) {
    tz = tz === undefined ? 8 : tz;
    let value = this.getDataValue(field);
    if(value == null) {
        return '';
    }
    return moment(this.getDataValue(field)).utcOffset(tz).format('YYYY-MM-DD HH:mm:ss');
}

var table = module.exports;

table.StorageRenter = sequelize.define("t_storage_renter", {
    account: {
        type: Sequelize.STRING
    },
    fileName: {
        type: Sequelize.STRING
    },
    ipfsHash: {
        type: Sequelize.STRING
    },
    fileSize: {
        type: Sequelize.INTEGER
    },
    status: {
        type: Sequelize.ENUM('active', 'delete')
    },
    path: {
    	type: Sequelize.STRING,
    	defaultValue: ''
    }
});

table.StorageFarmer = sequelize.define("t_storage_farmer", {
	boxSN: {
		type: Sequelize.STRING
	},
	saveSize: {
		type: Sequelize.BIGINT
	},
    storageMax: {
	    type: Sequelize.BIGINT
    },
    numObjects: {
	    type: Sequelize.BIGINT
    },
    rateIn: {
	    type: Sequelize.STRING
    },
    rateOut: {
	    type: Sequelize.STRING
    },
	measureTime: {
		type: Sequelize.DATE,
		defaultValue: Sequelize.NOW
	}
});

sequelize.sync({ force: false }).then(() => {
	console.log("sync success");
}).catch((error) => {
	console.log("FAILED: " + error);
})


