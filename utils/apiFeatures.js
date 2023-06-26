class APIFeatures {
    constructor(query, queryString) {
        this.query = query;
        this.queryString = queryString;
    }

    filter() {
        // eslint-disable-next-line node/no-unsupported-features/es-syntax
        const queryObj = { ...this.queryString };
        //console.log(queryObj);
        const excludedFields = ['page', 'sort', 'limit', 'fields'];
        excludedFields.forEach(el => delete queryObj[el])//deleted the unwanted fields from query
        console.log(this.queryString, queryObj);
              
        let queryStr = JSON.stringify(queryObj);
        queryStr =  queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);//done with regular expression inside of replace method in java script
        console.log(JSON.parse(queryStr));

        this.query = this.query.find(JSON.parse(queryStr))
        // let query = Tour.find(JSON.parse(queryStr))
        return this;//returns the current object
    }

    sort() {
        if (this.queryString.sort) { 
            const sortBy = this.queryString.sort.split(',').join(' ');
            //console.log(sortBy);output -- price ratingAverage (mentioned in url in sort field)
            this.query = this.query.sort(sortBy);
        } else {
            this.query = this.query.sort('-createdAt');//default sorting based on last added (-for decending order and + for asending order)
        }
        return this;//returns the current object
    }

    limitFields() {
        if (this.queryString.fields) { 
            const fields = this.queryString.fields.split(',').join(' ');
            //console.log(fields);output = name duration price (mentioned in url in sort field)
            this.query = this.query.select(fields);
        } else {
            this.query = this.query.select('-__v');//default case excludes the __v field and shows the data (- stands from exclude)
        }
        return this;
    }

    paginate() {
        const page = this.queryString.page * 1 || 1;
        const limit = this.queryString.limit * 1 || 100;
        const skip = (page - 1) * limit;

        //query_string = page=2&limit=10 , 1-10 page1, 11-20 page 2 , 21-30 page 3
        this.query = this.query.skip(skip).limit(limit);
        //skip specifies number of data to be skipped and limit is the no. of data to be displayed
        return this;
    }
}

module.exports = APIFeatures;


//ALTERNATIVE WAY OF THE API CLASS

//console.log(req.query);
        //1)BUILD THE QUERY
        // const queryObj = { ...req.query };
        // const excludedFields = ['page', 'sort', 'limit', 'fields'];
        // excludedFields.forEach(el => delete queryObj[el])
       
        // //console.log(req.query, queryObj); //req.query =give access and gives the parameters we need to filter
        // //while queryObj = gives accces to only the required object by creating a new object of the req.query object as reference
        
        // //2)ADVANCED FILTERING

        // let queryStr = JSON.stringify(queryObj);
        // queryStr =  queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);//done with regular expression inside of replace method in java script
        // //console.log(JSON.parse(queryStr));

        // let query = Tour.find(JSON.parse(queryStr)) 

        //{difficulty:'easy' , duration : { $gte : 5}}
        //greater than query string = /api/tours?duration[gte]=5&difficulty=easy        
        //{ duration: { gte: '5' }, difficulty: 'easy' } //fetched from the (req.query) after specifying the gte,lte,or etc parameter
        
        //3)SORTING     
        //console.log(req.query.sort);
        // if (req.query.sort) { 
        //     const sortBy = req.query.sort.split(',').join(' ');
        //     //console.log(sortBy);output -- price ratingAverage (mentioned in url in sort field)
        //     query = query.sort(sortBy);
        // } else {
        //     query = query.sort('-createdAt');//default sorting based on last added
        // }

        //4)FIELD LIMITING
        // if (req.query.fields) { 
        //     const fields = req.query.fields.split(',').join(' ');
        //     //console.log(fields);output -- name duration price (mentioned in url in sort field)
        //     query = query.select(fields);
        // } else {
        //     query = query.select('-__v');//default case excludes the __v field and shows the data (- stands from exclude)
        // }

        //5)PAGINATION
        // const page = req.query.page * 1 || 1;
        // const limit = req.query.limit * 1 || 100;
        // const skip = (page - 1) * limit;

        // //query_string = page=2&limit=10 , 1-10 page1, 11-20 page 2 , 21-30 page 3
        // query = query.skip(skip).limit(limit);
        // //skip specifies number of data to be skipped and limit is the no. of data to be displayed
        // if (req.query.page) {
        //     const numTours = await Tour.countDocuments();
        //     if (skip >= numTours) throw new Error('This Page Does not exist');
        // }
        
        //another method of mongo db findinf data
        // const query = Tour.find()
        //     .where('duration')
        //     .equals(5)//we can have lte,lt,gte,gt and many more
        //     .where('difficulty')
        //     .equals('easy');

