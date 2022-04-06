class TaskModuleResponseFactory {
    static createResponse(taskModuleInfoOrString) {
        if (typeof taskModuleInfoOrString === 'string') {
            return {
                task: {
                    type: 'message',
                    value: taskModuleInfoOrString
                }
            };
        }

        return {
            task: {
                type: 'continue',
                value: taskModuleInfoOrString
            }   
        };
    }

    static toTaskModuleResponse(taskInfo) {
        return TaskModuleResponseFactory.createResponse(taskInfo);
    }
}

module.exports.TaskModuleResponseFactory = TaskModuleResponseFactory;
