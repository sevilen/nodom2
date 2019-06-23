/**
/**
 * 编译器，负责模版的编译
 * @since 1.0
 */

class Compiler {
    /**
     * 编译 
     * @param view      指定的view
     * @param module    模块
     * @return          view
     */
    static compile(view){
        return compileEl(view);
    }

    /**
     * 编译
     * @param element   待编译element
     * @return          虚拟element
     */
    static compile(module,elementStr){
        let dom = new Element();
        const div = nodom.newEl('div');
        div.innerHTML = elementStr;
        dom.isRoot = true;
        //调用编译
        this.compileDom(module,div,dom);
        return dom;
    }

    /**
     * 编译dom
     * @param ele           待编译element
     * @param parent        父节点（virtualdom）   
     * @param expressions   表达式数组
     * @param directives    指令数组
     */

    static compileDom(module,ele,parent){
        const me = this;
        let oe = new Element();
        let props = oe.props;
        //注视标志
        let isComment = false;
        switch(ele.nodeType) {
            case Node.ELEMENT_NODE:             //元素
                oe.tagName = ele.tagName;
                //遍历attributes
                for(let i=0;i<ele.attributes.length;i++){
                    let attr = ele.attributes[i];
                    let v = attr.value.trim();
                    if(attr.name.startsWith('x-')){         //指令
                        //添加到dom指令集
                        oe.directives.push(new Directive(attr.name.substr(2),v,oe,module));
                    }else if(attr.name.startsWith('e-')){    //事件
                        let en = attr.name.substr(2);
                        oe.events[en] = new Event(en,attr.value.trim());
                    }else{
                        let isExpr = false;
                        if(v !== ''){
                            let ra = me.compileExpression(module,v);
                            if(nodom.isArray(ra)){
                                oe.exprProps[attr.name] = ra;
                                isExpr = true;
                            }
                        }
                        if(!isExpr){
                            oe.props[attr.name] = v;
                        }
                    }
                }
                let subEls = [];
                //子节点编译
                ele.childNodes.forEach(function(nd){
                    subEls.push(me.compileDom(module,nd,oe));
                });

                //指令按优先级排序
                oe.directives.sort((a,b)=>{
                    return DirectiveManager.getType(a.type).prio - DirectiveManager.getType(b.type).prio;
                });
                break;
            case Node.TEXT_NODE:                    //文本节点
                let txt = ele.textContent;
                if(txt === ""){  //内容为空不加入树
                    return;
                }
                let expA = me.compileExpression(module,txt);
                if(typeof expA === 'string'){   //无表达式
                    oe.textContent = expA;
                }else{                          //含表达式
                    oe.expressions = expA;    
                }
                break;
            case Node.COMMENT_NODE:             //注释
                isComment = true;
                break;
        }
        
        //添加到子节点,comment节点不需要    
        if(!isComment && parent){
            parent.children.push(oe);    
        }
        return oe;
    }
    

    /**
     * 处理含表达式串
     * @param exprStr   含表达式的串
     * @return          处理后的字符串和表达式数组
     */
    static compileExpression(module,exprStr){
        let reg = new RegExp("\{\{.+?\}\}",'g');
        if(reg.test(exprStr) === false){
            return exprStr;
        }
        let retA = new Array();
        let re,oIndex=0;
        let ite = exprStr.matchAll(/\{\{.+?\}\}/g);
        for (const re of ite) {
            let ind = re.index;
            //字符串
            if(ind>oIndex){
                let s = exprStr.substring(oIndex,ind);
                retA.push(s);
            }

            //实例化表达式对象
            let exp = new Expression(re[0].substring(2,re[0].length-2),module);
            //加入工厂
            module.expressionFactory.add(exp.id,exp);
            retA.push(exp.id);
            oIndex = ind + re[0].length;
        }
        return retA;
    }

    static compileEvent(){

    }

    /**
     * 处理指令
     * @param dirName   指令名
     * @param value     指令值
     */
    /*static compileDirective(type,value){
        //实例化指令对象
        return new Directive(type,value); 
        //directives.push(di);
        //return di;
    }*/
}
