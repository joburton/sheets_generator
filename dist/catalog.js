export const modules = [
 ['aircraft-cable','Aircraft cable',false],['straps','Straps',true],['to-strut','To strut',true],['to-grid','To grid',true],['piping','Piping',false],['com','COM',true],['lbo','LBO',true],['cords','Cords',true],['junctions','Junctions',true],['pet','PET',true]
].map(([id,title,placeholder])=>({id,title,placeholder,file:`assets/${id}.pdf`}));
export const covers={
 'suspension-methods':{title:'Suspension methods',modules:['aircraft-cable','straps','to-strut','to-grid'],placeholder:false},
 'methods-of-construction':{title:'Methods of construction',modules:['piping','com','junctions'],placeholder:true},
 'unique-to-sabin':{title:'Unique to SABIN',modules:['straps','piping','com','cords','junctions'],placeholder:true},
 materials:{title:'Materials',modules:['straps','com','cords','pet'],placeholder:true},
 colors:{title:'Colors',modules:['straps','piping','cords','pet'],placeholder:true}
};
