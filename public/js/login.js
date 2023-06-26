/*eslint-disable*/
import axios from 'axios';
import { showAlert } from './alerts';

export const login = async (email, password) => {
    
    //console.log(email,password);
    try {
        const res = await axios({
            method: 'POST',
            url: 'http://localhost:3000/api/v1/users/login',
            data: {
                email: email, //the email(here is the field in the backend the expects the data): email (is the parameter passed)
                password: password //the password(here is the field in the backend the expects the data): password (is the parameter passed)
            }
        });

        if (res.data.status === 'success') {
            showAlert('success','Logged in succesfully');
            window.setTimeout(() => {
                location.assign('/');//way to redirect in js
            }, 1000);
        }
    //console.log(res); 
    } catch (err) {
        showAlert('error',err.response.data.message);
    }
    
}

export const logout = async () => {
    try {
        const res = await axios({
            method: 'GET',
            url: 'http://localhost:3000/api/v1/users/logout',
        });

        //console.log(res);

        if (res.data.status = 'success') {
            showAlert('success','Loggedout succesfully');
            //location.reload(true)//reload the current page
            window.setTimeout(() => {
                location.assign('/');//way to redirect in js
            }, 1000);
        }

    } catch (err) {
        showAlert('error' , 'Error logging out! Try again.')
    }
}

export const signup = async (name ,email, password , passwordConfirm) => {
    
    //console.log(email,password);
    try {
        const res = await axios({
            method: 'POST',
            url: 'http://localhost:3000/api/v1/users/signup',
            data: {
                name: name, //the name(here is the field in the backend the expects the data): name (is the parameter passed)
                email: email, //the email(here is the field in the backend the expects the data): email (is the parameter passed)
                password: password, //the password(here is the field in the backend the expects the data): password (is the parameter passed)
                passwordConfirm: passwordConfirm //the passwordConfirm(here is the field in the backend the expects the data): passwordConfirm (is the parameter passed)
            }
        });
        console.log(res); 

        if (res.data.status === 'success') {
            showAlert('success','Signed up succesfully');
            window.setTimeout(() => {
                location.assign('/');//way to redirect in js
            }, 1000);
        }
    console.log(res); 
    } catch (err) {
        showAlert('error', err.response.data.message);
    }
    
}
