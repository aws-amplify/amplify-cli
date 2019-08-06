import { parse, Compile } from 'velocityjs';

const asts = parse(document.querySelector('#tmpl').innerHTML);
const data = {
  items: [{a:'1'},{a: 'successed'}]
};
const s = (new Compile(asts)).render(data);

document.querySelector('.foo').innerHTML = s;
